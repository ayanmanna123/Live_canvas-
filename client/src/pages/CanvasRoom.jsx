import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import DrawingCanvas from '../components/DrawingCanvas';
import Toolbar from '../components/Toolbar';
import Chat from '../components/Chat';
import UserHistoryPanel from '../components/UserHistory';
import CanvasListPanel from '../components/CanvasListPanel';
import NewCanvasModal from '../components/NewCanvasModal';
import { Share2, Users as UsersIcon, LogOut, Bell, BellOff, Video, Plus, Layout, History, Sparkles, Camera } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import Peer from 'simple-peer';
import VideoCall from '../components/VideoCall';
import WatchParty from '../components/WatchParty';

const CanvasRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  
  // Use location state, then localStorage, then prompt
  const [userName, setUserName] = useState(() => {
    return location.state?.userName || 
           localStorage.getItem('live-canvas-username') || 
           `Guest_${Math.floor(Math.random() * 1000)}`;
  });
  const [users, setUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#0f172a'); // Default slate-900
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState('pencil');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [notification, setNotification] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUsersListOpen, setIsUsersListOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRopes, setShowRopes] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [isWatchPartyOpen, setIsWatchPartyOpen] = useState(false);
  const [movieUrl, setMovieUrl] = useState('');
  const [moviePlaying, setMoviePlaying] = useState(false);
  const [movieTime, setMovieTime] = useState(0);
  const [movieMasterId, setMovieMasterId] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  
  // Canvas Management State
  const [activeCanvas, setActiveCanvas] = useState(null);
  const [canvasList, setCanvasList] = useState([]);
  const [isCanvasListOpen, setIsCanvasListOpen] = useState(false);
  const [isNewCanvasModalOpen, setIsNewCanvasModalOpen] = useState(false);
  
  const canvasRef = useRef(null);
  const notificationAudio = useRef(new Audio('/notification.mp3'));

  // Video Call State
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: { stream, userName } }
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const peersRef = useRef({}); // { socketId: PeerInstance }
  const cameraStreamRef = useRef(null);

  const { permission, requestPermission } = usePushNotifications(socket, roomId, socket?.id, userName);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          if (e.shiftKey) {
            canvasRef.current?.redo();
          } else {
            canvasRef.current?.undo();
          }
          e.preventDefault();
        } else if (e.key === 'y') {
          canvasRef.current?.redo();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join-room', { roomId, userName });

    // Listeners
    socket.on('user-list-update', (userList) => {
      setUsers(userList);
    });

    socket.on('receive-message', (msg) => {
      const isVisible = document.visibilityState === 'visible';
      
      if (!isChatOpen || !isVisible) {
        setUnreadCount(prev => prev + 1);
        setNotification(`New message from ${msg.userName}`);
        setTimeout(() => setNotification(null), 3000);

        // Native device notification
        if (Notification.permission === 'granted') {
          new Notification('New Message', {
            body: `${msg.userName}: ${msg.text}`,
            icon: '/favicon.svg',
            tag: 'chat-notification',
            renotify: true
          });
        }

        // Play notification sound
        notificationAudio.current.play().catch(e => console.log('Audio play failed:', e));
      }
    });

    socket.on('cursor-move-remote', ({ userId, userName, position }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [userId]: { userName, position }
      }));
    });

    socket.on('background-changed', (newColor) => {
      setBgColor(newColor);
    });

    socket.on('notification', ({ message }) => {
      setNotification(message);
      setTimeout(() => setNotification(null), 3000);
    });

    socket.on('user-history-update', (history) => {
      setUserHistory(history);
    });

    socket.on('webrtc-signal', (data) => {
      const { from, signal } = data;
      if (peersRef.current[from]) {
        peersRef.current[from].signal(signal);
      } else if (localStream && inCall) {
        // Someone is calling us
        const peer = createPeer(from, socket.id, localStream, false);
        peersRef.current[from] = peer;
        peer.signal(signal);
      }
    });
    socket.on('movie-update-remote', (data) => {
      if (data.action === 'url' || data.url) {
        setMovieUrl(data.url);
      }
      if (data.action === 'play') setMoviePlaying(true);
      if (data.action === 'pause') setMoviePlaying(false);
      if (data.action === 'seek') setMovieTime(data.currentTime);
      if (data.masterId) setMovieMasterId(data.masterId);
      
      // Handle initial load state from server
      if (!data.action && data.url !== undefined) {
        setMovieUrl(data.url);
        setMoviePlaying(data.playing);
        setMovieTime(data.currentTime);
        setMovieMasterId(data.masterId);
      }
    });

    socket.on('sync-to-master', ({ currentTime }) => {
      setMovieTime(currentTime);
    });

    socket.on('active-canvas-update', (canvas) => {
      setActiveCanvas(canvas);
      if (canvas.bgColor) setBgColor(canvas.bgColor);
    });

    socket.on('canvas-list-update', (list) => {
      setCanvasList(list);
    });

    socket.on('clear-canvas-remote', ({ canvasId }) => {
      // Handled by DrawingCanvas typically, but we can sync state here if needed
    });

    return () => {
      socket.off('user-list-update');
      socket.off('cursor-move-remote');
      socket.off('background-changed');
      socket.off('notification');
      socket.off('user-history-update');
      socket.off('webrtc-signal');
      socket.off('movie-update-remote');
      socket.off('sync-to-master');
      socket.off('get-master-time');
    };
  }, [socket, roomId, userName, localStream, inCall]);

  const createPeer = (userToSignal, callerId, stream, initiator) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('webrtc-signal', {
        to: userToSignal,
        from: callerId,
        signal
      });
    });

    peer.on('stream', (remoteStream) => {
      const user = users.find(u => u.id === userToSignal);
      setRemoteStreams(prev => ({
        ...prev,
        [userToSignal]: { 
          stream: remoteStream, 
          userName: user ? user.name : 'Unknown User' 
        }
      }));
    });

    peer.on('close', () => {
      setRemoteStreams(prev => {
        const copy = { ...prev };
        delete copy[userToSignal];
        return copy;
      });
    });

    return peer;
  };

  const handleJoinCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      cameraStreamRef.current = stream;
      setInCall(true);

      // Initiate calls to everyone else in the room
      const newPeers = {};
      users.forEach((user) => {
        if (user.id !== socket.id) {
          const peer = createPeer(user.id, socket.id, stream, true);
          newPeers[user.id] = peer;
        }
      });
      peersRef.current = newPeers;
    } catch (err) {
      console.error('Failed to get local stream', err);
      setNotification('Could not access camera/microphone');
    }
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Handle stop share from browser UI
        screenTrack.onended = () => {
          stopScreenShare(screenTrack);
        };

        // Replace track for all peers
        Object.values(peersRef.current).forEach(peer => {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            peer.replaceTrack(videoTrack, screenTrack, localStream);
          }
        });

        // Update local stream to show screen
        const newStream = new MediaStream([
          ...localStream.getAudioTracks(),
          screenTrack
        ]);
        setLocalStream(newStream);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Failed to get screen stream', err);
      }
    } else {
      const screenTrack = localStream.getVideoTracks()[0];
      stopScreenShare(screenTrack);
    }
  };

  const stopScreenShare = async (screenTrack) => {
    if (screenTrack) screenTrack.stop();
    
    // Re-acquire camera if we don't have it or it's stopped
    let camStream = cameraStreamRef.current;
    if (!camStream || !camStream.getVideoTracks()[0] || camStream.getVideoTracks()[0].readyState === 'ended') {
      try {
        camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraStreamRef.current = camStream;
      } catch (err) {
        console.error('Failed to re-acquire camera', err);
        return;
      }
    }

    const camVideoTrack = camStream.getVideoTracks()[0];
    
    // Replace track back for all peers
    Object.values(peersRef.current).forEach(peer => {
      const currentVideoTrack = localStream.getVideoTracks()[0];
      if (currentVideoTrack) {
        peer.replaceTrack(currentVideoTrack, camVideoTrack, localStream);
      }
    });

    const restoredStream = new MediaStream([
      ...localStream.getAudioTracks(),
      camVideoTrack
    ]);
    setLocalStream(restoredStream);
    setIsScreenSharing(false);
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    Object.values(peersRef.current).forEach(peer => peer.destroy());
    peersRef.current = {};
    setLocalStream(null);
    setRemoteStreams({});
    setInCall(false);
    setIsScreenSharing(false);
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas?')) {
      socket.emit('clear-canvas', { roomId, canvasId: activeCanvas?._id });
    }
  };

  const handleCreateCanvas = (name) => {
    socket.emit('create-canvas', { roomId, name, userName });
  };

  const handleSwitchCanvas = (canvasId) => {
    socket.emit('switch-canvas', { roomId, canvasId });
  };

  const handleBgChange = (newColor) => {
    setBgColor(newColor);
    socket.emit('change-background', { roomId, color: newColor });
  };

  const handleSaveDrawing = () => {
    setIsSaving(true);
    // Explicit manual save confirmation.
    // The auto-save (fixed on server) handles the actual persistence.
    setTimeout(() => {
      setIsSaving(false);
    }, 2000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(roomId);
    setNotification('Room ID copied to clipboard!');
    setTimeout(() => setNotification(null), 2000);
  };

  const handleCapture = () => {
    const canvasName = activeCanvas?.name || 'canvas';
    canvasRef.current?.download(`${canvasName}-${new Date().getTime()}.png`);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    setNotification('Uploading image...');
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadResponse = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload API error:', errorText);
        throw new Error(`Upload failed: ${errorText}`);
      }
      
      const result = await uploadResponse.json();
      
      // 3. Add to Canvas
      const img = new Image();
      img.src = result.url;
      img.crossOrigin = "anonymous"; // Handle CORS for canvas operations
      img.onload = () => {
        // Calculate initial size (max 400px width/height)
        let w = img.width;
        let h = img.height;
        const max = 400;
        if (w > max || h > max) {
          const ratio = Math.min(max / w, max / h);
          w *= ratio;
          h *= ratio;
        }

        const imageStroke = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: socket.id,
          type: 'image',
          imageUrl: result.url,
          points: [{ x: 100 - panOffset.x, y: 100 - panOffset.y }], // Place in viewport
          imageWidth: w,
          imageHeight: h,
          tool: 'image'
        };
        
        // Dispatch locally for instant feedback
        if (canvasRef.current) {
          canvasRef.current.addStroke(imageStroke);
        }

        socket.emit('draw', { roomId, canvasId: activeCanvas?._id, stroke: imageStroke });
        setNotification('Image added to canvas!');
        setTimeout(() => setNotification(null), 2000);
      };
    } catch (error) {
      console.error('Upload error:', error);
      setNotification(`Upload failed: ${error.message}`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div 
      className="relative h-screen w-screen overflow-hidden" 
      style={{ backgroundColor: bgColor }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
          handleImageUpload(file);
        }
      }}
    >
      {/* Connectivity Status */}
      {!isConnected && (
        <div className="absolute top-4 left-4 z-[100] flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 border border-red-500/50 backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-red-200">Disconnected</span>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-indigo-600 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <p className="text-sm font-semibold">{notification}</p>
        </div>
      )}

      {/* Toolbar */}
      <Toolbar 
        color={color} setColor={setColor}
        bgColor={bgColor} setBgColor={handleBgChange}
        size={size} setSize={setSize}
        tool={tool} setTool={setTool}
        onClear={handleClearCanvas}
        onSave={handleSaveDrawing}
        isSaving={isSaving}
        onShare={handleShare}
        userCount={users.length}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) {
            setUnreadCount(0);
            // Request push notification permission
            if (permission === 'default') {
              requestPermission();
            }
          }
        }}
        isChatOpen={isChatOpen}
        unreadCount={unreadCount}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        showRopes={showRopes}
        setShowRopes={setShowRopes}
        onToggleHistory={() => {
          setIsHistoryOpen(!isHistoryOpen);
          if (isHistoryOpen) setIsChatOpen(false);
        }}
        isHistoryOpen={isHistoryOpen}
        inCall={inCall}
        onToggleCall={inCall ? handleEndCall : handleJoinCall}
        autoMode={autoMode}
        setAutoMode={setAutoMode}
        onToggleWatchParty={() => setIsWatchPartyOpen(!isWatchPartyOpen)}
        isWatchPartyOpen={isWatchPartyOpen}
        onOpenGames={() => navigate('/games', { state: { roomId, userName } })}
        onImageUpload={handleImageUpload}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
      />
      
      {inCall && localStream && (
        <VideoCall 
          localStream={localStream}
          remoteStreams={remoteStreams}
          onEndCall={handleEndCall}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={handleToggleScreenShare}
        />
      )}

      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 z-[60] flex items-center justify-between px-6 pointer-events-none">
        {/* Top Left: Logo & Room Info */}
        <div className="flex items-center gap-4 pointer-events-auto glass-light rounded-2xl p-1.5 pr-4 animate-in slide-in-from-top-10 duration-500">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight tracking-wide">
              {activeCanvas?.name || 'Untitled'}
            </h1>
            <div className="flex items-center gap-2">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Room: {roomId}</p>
               <div className="h-1 w-1 rounded-full bg-slate-600" />
               <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-300">{users.length} Online</span>
               </div>
            </div>
          </div>
        </div>

        {/* Top Right: Global Actions */}
        <div className="flex items-center gap-2 pointer-events-auto glass-light rounded-2xl p-1.5 animate-in slide-in-from-top-10 duration-500 delay-100">
          <button 
            onClick={() => setIsCanvasListOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all"
          >
            <History className="size-4" />
            <span className="text-[11px] font-black uppercase tracking-wider">Canvases</span>
          </button>
          
          <button 
            onClick={handleCapture}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all"
          >
            <Camera className="size-4" />
            <span className="text-[11px] font-black uppercase tracking-wider">Capture</span>
          </button>

          <button 
            onClick={() => setIsNewCanvasModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <Plus className="size-4 stroke-[3px]" />
            <span>New</span>
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button 
            onClick={() => navigate('/')}
            className="size-10 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
            title="Leave Room"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      {/* User Presences (Expandable on click) */}
      <div className="fixed top-20 left-6 z-40 pointer-events-none">
         <div 
            className="pointer-events-auto glass-light rounded-2xl p-2 cursor-pointer group transition-all hover:bg-white/5"
            onClick={() => setIsUsersListOpen(!isUsersListOpen)}
         >
            <div className="flex -space-x-2">
               {users.slice(0, 3).map((user, i) => (
                  <div key={user.id} className="size-8 rounded-full border-2 border-slate-900 bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg" style={{ zIndex: 10 - i }}>
                     {user.name.charAt(0).toUpperCase()}
                  </div>
               ))}
               {users.length > 3 && (
                  <div className="size-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white z-0">
                     +{users.length - 3}
                  </div>
               )}
            </div>

            {isUsersListOpen && (
               <div className="mt-4 space-y-2 glass p-3 rounded-2xl min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Active Users</p>
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 px-1 py-1">
                      <div className={`size-1.5 rounded-full ${user.id === socket?.id ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                      <span className="text-xs text-slate-200 font-medium truncate">
                        {user.name} {user.id === socket?.id && '(You)'}
                      </span>
                    </div>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* Side Panels */}
      <Chat 
        socket={socket}
        roomId={roomId}
        userName={userName}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <UserHistoryPanel 
        history={userHistory}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <WatchParty 
        isOpen={isWatchPartyOpen}
        onClose={() => setIsWatchPartyOpen(false)}
        roomId={roomId}
        socket={socket}
        url={movieUrl}
        setUrl={setMovieUrl}
        playing={moviePlaying}
        setPlaying={setMoviePlaying}
        currentTime={movieTime}
        setCurrentTime={setMovieTime}
        masterId={movieMasterId}
      />

      {/* Drawing Canvas */}
      <div className="absolute inset-0 z-0">
        <DrawingCanvas 
          ref={canvasRef}
          roomId={roomId} 
          canvasId={activeCanvas?._id}
          userName={userName}
          color={color}
          bgColor={bgColor}
          size={size}
          tool={tool}
          onPan={setPanOffset}
          showRopes={showRopes}
          autoMode={autoMode}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
        />
      </div>

      {/* Canvas Management Overlays */}
      <CanvasListPanel 
        isOpen={isCanvasListOpen}
        onClose={() => setIsCanvasListOpen(false)}
        canvases={canvasList}
        activeCanvasId={activeCanvas?._id}
        onSwitch={handleSwitchCanvas}
        onNew={() => {
          setIsCanvasListOpen(false);
          setIsNewCanvasModalOpen(true);
        }}
      />

      <NewCanvasModal 
        isOpen={isNewCanvasModalOpen}
        onClose={() => setIsNewCanvasModalOpen(false)}
        onCreate={handleCreateCanvas}
      />

      {/* Remote Cursors Presence Layer */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {Object.entries(remoteCursors).map(([id, cursor]) => (
          id !== socket?.id && (
            <div 
              key={id}
              className="absolute transition-all duration-75"
              style={{ 
                left: cursor.position.x + panOffset.x, 
                top: cursor.position.y + panOffset.y 
              }}
            >
              <div className="relative">
                <svg width="24" height="24" viewBox="0 0 24 24" className="fill-indigo-500 drop-shadow-md">
                  <path d="M5.653 3.123l13.563 13.562-4.015.589 4.108 8.019-2.212 1.141-4.05-7.899-2.727 3.328V3.123z" />
                </svg>
                <div className="absolute left-4 top-4 whitespace-nowrap rounded bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                  {cursor.userName}
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default CanvasRoom;
