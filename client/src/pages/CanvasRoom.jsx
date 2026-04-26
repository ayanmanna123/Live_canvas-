import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import DrawingCanvas from '../components/DrawingCanvas';
import Toolbar from '../components/Toolbar';
import Chat from '../components/Chat';
import UserHistoryPanel from '../components/UserHistory';
import CanvasListPanel from '../components/CanvasListPanel';
import NewCanvasModal from '../components/NewCanvasModal';
import { Share2, Users as UsersIcon, LogOut, Bell, BellOff, Video, Plus, Layout, History, Sparkles, Camera, Paintbrush } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import Peer from 'simple-peer';
import VideoCall from '../components/VideoCall';
import WatchParty from '../components/WatchParty';
import RomanticWidgets from '../components/RomanticWidgets';
import MemoryVault from '../components/MemoryVault';
import CaptureModal from '../components/CaptureModal';
import VibeTracker, { VIBES } from '../components/VibeTracker';
import FloatingHearts from '../components/FloatingHearts';
import GiftPopup from '../components/GiftPopup';
import GiftBox from '../components/GiftBox';
import GiftRevealModal from '../components/GiftRevealModal';

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
  const [color, setColor] = useState('#FFB6C1');
  const [bgColor, setBgColor] = useState('#EBEBEB'); // Default Light Grey as requested
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
  const [reactions, setReactions] = useState([]); // { id, emoji, position, userId }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Canvas Management State
  const [activeCanvas, setActiveCanvas] = useState(null);
  const [canvasList, setCanvasList] = useState([]);
  const [isCanvasListOpen, setIsCanvasListOpen] = useState(false);
  const [isNewCanvasModalOpen, setIsNewCanvasModalOpen] = useState(false);
  
  // Hand-in-Hand Mode State
  const [isHandInHand, setIsHandInHand] = useState(false);
  
  // Vibe State
  const [currentVibe, setCurrentVibe] = useState('happy');
  const [isVibeOpen, setIsVibeOpen] = useState(false);
  const vibeRef = useRef('happy');
  
  // Sync ref with state
  useEffect(() => {
    vibeRef.current = currentVibe;
  }, [currentVibe]);
  
  // Memory Vault State
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [capturePreview, setCapturePreview] = useState(null);
  
  // Gift State
  const [gifts, setGifts] = useState([]);
  const [isGiftPopupOpen, setIsGiftPopupOpen] = useState(false);
  const [hasGifts, setHasGifts] = useState(false);
  const [revealGift, setRevealGift] = useState(null);
  
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

    socket.on('cursor-move-remote', ({ userId, userName, position, vibe }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [userId]: { userName, position, vibe }
      }));
    });

    socket.on('background-changed', (newColor) => {
      setBgColor(newColor);
    });

    socket.on('cursor-reaction-remote', (data) => {
      const id = Math.random().toString(36).substr(2, 9);
      setReactions(prev => [...prev, { ...data, id }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
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
      if (canvas.bgColor) {
        // Automatic migration: If the room was created with the old default dark color,
        // switch it to the new romantic light default.
        if (canvas.bgColor === '#0f172a') {
          handleBgChange('#EBEBEB');
        } else {
          setBgColor(canvas.bgColor);
        }
      }
    });

    socket.on('canvas-list-update', (list) => {
      setCanvasList(list);
    });

    socket.on('gift-list-update', (updatedGifts) => {
      setGifts(updatedGifts);
      // Check if there are any un-opened gifts for this user
      const unOpened = updatedGifts.filter(g => !g.isOpened && g.senderId !== socket.id);
      setHasGifts(unOpened.length > 0);
    });

    socket.on('receive-gift', (gift) => {
      if (gift.senderId !== socket.id) {
        setNotification(`You have a new Time Capsule from ${gift.senderName}! 🎁`);
        setHasGifts(true);
        // Play sound
        notificationAudio.current.play().catch(e => console.log('Audio play failed:', e));
        
        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      }
    });

    socket.on('gift-opened', (openedGift) => {
      setGifts(prev => prev.map(g => g._id === openedGift._id ? openedGift : g));
      setRevealGift(openedGift);
    });

    socket.on('memories-update', (updatedMemories) => {
      // This will ensure the vault updates in real-time if we want to sync state
      // For now, MemoryVault fetches on open, but this is good for consistency
    });

    socket.on('clear-canvas-remote', ({ canvasId }) => {
      // Handled by DrawingCanvas typically
    });

    const handleMouseMove = (e) => {
      const position = { x: e.clientX, y: e.clientY };
      setMousePos(position);
      socket.emit('cursor-move', { roomId, userName, position, vibe: vibeRef.current });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      socket.off('user-list-update');
      socket.off('cursor-move-remote');
      socket.off('cursor-reaction-remote');
      socket.off('background-changed');
      socket.off('notification');
      socket.off('user-history-update');
      socket.off('webrtc-signal');
      socket.off('movie-update-remote');
      socket.off('sync-to-master');
      socket.off('canvas-list-update');
      socket.off('active-canvas-update');
      socket.off('gift-list-update');
      socket.off('receive-gift');
      socket.off('gift-opened');
      socket.off('memories-update');
    };
  }, [socket, roomId, userName, localStream, inCall]);

  const triggerReaction = (emoji) => {
    if (!socket) return;
    const data = { roomId, emoji, position: mousePos };
    socket.emit('cursor-reaction', data);
    
    // Add locally
    const id = Math.random().toString(36).substr(2, 9);
    setReactions(prev => [...prev, { ...data, id, userId: socket.id }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

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

  const handleSendGift = async (giftData) => {
    if (!socket) return;
    
    let content = giftData.content;
    
    // If it's a drawing, capture the canvas state
    if (giftData.contentType === 'drawing') {
      try {
        const drawingData = canvasRef.current.getCanvas().toDataURL('image/png');
        // Upload the drawing to ImageKit first
        const blob = await (await fetch(drawingData)).blob();
        const file = new File([blob], `gift_${Date.now()}.png`, { type: 'image/png' });
        
        const formData = new FormData();
        formData.append('image', file);
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const uploadResponse = await fetch(`${backendUrl}/api/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          content = uploadData.url;
        }
      } catch (err) {
        console.error('Failed to capture gift drawing:', err);
      }
    }

    const fullGiftData = {
      ...giftData,
      content,
      roomId,
      senderId: socket.id,
      senderName: userName,
      position: { 
        x: Math.random() * (window.innerWidth - 300) + 150, 
        y: Math.random() * (window.innerHeight - 300) + 150 
      }
    };

    socket.emit('send-gift', fullGiftData);
    setNotification('Love Box sealed and sent to the future! 🎁✨');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenGift = (giftId) => {
    if (!socket) return;
    socket.emit('open-gift', { giftId, roomId });
  };

  const handleDeleteGift = (giftId) => {
    if (!socket) return;
    if (window.confirm('Delete this Time Capsule?')) {
      socket.emit('delete-gift', { giftId, roomId });
    }
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
    setNotification('Invite Link Copied to Your Eternal Canvas! ✨');
    setTimeout(() => setNotification(null), 2000);
  };

  const handleCapture = () => {
    const dataUrl = canvasRef.current?.getDataURL();
    if (dataUrl) {
      setCapturePreview(dataUrl);
      setIsCaptureModalOpen(true);
    }
  };

  const handleSaveToVault = async (caption) => {
    try {
      setNotification('Saving to Vault...');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      // 1. Convert Data URL to Blob for upload
      const response = await fetch(capturePreview);
      const blob = await response.blob();
      const file = new File([blob], `capture_${Date.now()}.png`, { type: 'image/png' });

      // 2. Upload to ImageKit
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadResponse = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) throw new Error('Upload failed');
      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.url;

      // 3. Save Memory to Database
      const saveResponse = await fetch(`${backendUrl}/api/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          imageUrl,
          caption,
          createdBy: userName
        })
      });

      if (!saveResponse.ok) throw new Error('Failed to save memory');

      setNotification('Moment preserved in Memory Vault! ✨');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error saving to vault:', error);
      setNotification('Failed to save memory. Please try again.');
    }
  };

  const handleImageUpload = async (file, aiResult = null) => {
    if (!file && !aiResult) return;
    
    try {
      let imageUrl = '';
      let w = 400;
      let h = 400;

      if (aiResult) {
        imageUrl = aiResult.url;
        w = aiResult.width || 400;
        h = aiResult.height || 400;
      } else {
        setNotification('Uploading image...');
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const formData = new FormData();
        formData.append('image', file);
        
        const uploadResponse = await fetch(`${backendUrl}/api/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Upload failed: ${errorText}`);
        }
        
        const result = await uploadResponse.json();
        imageUrl = result.url;

        // Get dimensions for uploaded image
        const img = new Image();
        img.src = imageUrl;
        await new Promise(resolve => {
          img.onload = () => {
            const max = 400;
            if (img.width > max || img.height > max) {
              const ratio = Math.min(max / img.width, max / img.height);
              w = img.width * ratio;
              h = img.height * ratio;
            } else {
              w = img.width;
              h = img.height;
            }
            resolve();
          };
        });
      }
      
      const imageStroke = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: socket.id,
        type: 'image',
        imageUrl: imageUrl,
        points: [{ x: 100 - panOffset.x, y: 100 - panOffset.y }], // Place in viewport
        imageWidth: w,
        imageHeight: h,
        tool: 'image',
        isAI: !!aiResult // Tag as AI image for transparency handling
      };
      
      if (canvasRef.current) {
        canvasRef.current.addStroke(imageStroke);
      }

      socket.emit('draw', { roomId, canvasId: activeCanvas?._id, stroke: imageStroke });
      setNotification(aiResult ? 'AI Image added!' : 'Image added to canvas!');
      setTimeout(() => setNotification(null), 2000);
    } catch (error) {
      console.error('Image handling error:', error);
      setNotification(`Error: ${error.message}`);
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
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-rose-500 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 flex items-center gap-2">
          <Sparkles className="size-4 animate-pulse" />
          <p className="text-sm font-bold">{notification}</p>
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
        onReaction={triggerReaction}
        onCapture={handleCapture}
        onOpenVault={() => setIsVaultOpen(true)}
        isHandInHand={isHandInHand}
        setIsHandInHand={setIsHandInHand}
        isVibeOpen={isVibeOpen}
        onToggleVibe={() => setIsVibeOpen(!isVibeOpen)}
        onOpenGiftPopup={() => setIsGiftPopupOpen(true)}
        hasGifts={hasGifts}
        remoteCursors={remoteCursors}
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
        <div className="flex items-center gap-4 pointer-events-auto glass-light rounded-3xl p-2 pr-6 animate-in slide-in-from-top-10 duration-700 shadow-lg border-white/40">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200/50 heart-pulse">
            <Paintbrush className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-rose-600 leading-tight tracking-tight font-serif italic">
              {activeCanvas?.name || 'Eternal Canvas ✨'}
            </h1>
            <div className="flex items-center gap-2">
               <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Memory Room: {roomId}</p>
               <div className="h-1 w-1 rounded-full bg-rose-200" />
               <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">Synchronized Now ✨</span>
               </div>
            </div>
          </div>
        </div>

        {/* Top Right: Global Actions */}
        <div className="flex items-center gap-2 pointer-events-auto glass rounded-3xl p-2 animate-in slide-in-from-top-10 duration-700 delay-100 shadow-md">
          <button 
            onClick={() => setIsCanvasListOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-all font-bold"
          >
            <History className="size-4" />
            <span className="text-[11px] uppercase tracking-widest">Our Journey</span>
          </button>
          
          <button 
            onClick={handleCapture}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-all font-bold"
          >
            <Camera className="size-4" />
            <span className="text-[11px] uppercase tracking-widest">Preserve Frame</span>
          </button>

          <button 
            onClick={() => setIsNewCanvasModalOpen(true)}
            className="px-6 py-2 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-rose-200/50 flex items-center gap-2"
          >
            <Plus className="size-4 stroke-[3px]" />
            <span>Preserve Moment</span>
          </button>

          <div className="w-px h-6 bg-rose-100 mx-1" />

          <button 
            onClick={() => navigate('/')}
            className="size-10 flex items-center justify-center rounded-2xl hover:bg-rose-50 text-rose-300 hover:text-rose-500 transition-all"
            title="Leave Room"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      {/* User Presences (Expandable on click) */}
      <div className="fixed top-24 left-6 z-40 pointer-events-none">
         <div 
            className="pointer-events-auto glass rounded-3xl p-2.5 cursor-pointer group transition-all hover:bg-rose-50/50 shadow-md border-white/50"
            onClick={() => setIsUsersListOpen(!isUsersListOpen)}
         >
            <div className="flex -space-x-3">
               {users.slice(0, 3).map((user, i) => (
                  <div key={user.id} className="size-10 rounded-full border-2 border-white bg-gradient-to-tr from-rose-300 to-pink-400 flex items-center justify-center text-xs font-black text-white shadow-md heart-pulse" style={{ zIndex: 10 - i, animationDelay: `${i * 0.2}s` }}>
                     {user.name.charAt(0).toUpperCase()}
                  </div>
               ))}
               {users.length > 3 && (
                  <div className="size-10 rounded-full border-2 border-white bg-rose-100 flex items-center justify-center text-xs font-black text-rose-500 z-0">
                     +{users.length - 3}
                  </div>
               )}
            </div>

            {isUsersListOpen && (
               <div className="mt-4 space-y-2 glass p-4 rounded-3xl min-w-[180px] animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl border-white/60">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-rose-400" />
                    {users.length} Souls Synchronized
                  </p>
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-rose-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`size-2 rounded-full ${user.id === socket?.id ? 'bg-rose-500 animate-pulse' : 'bg-pink-400'}`} />
                        <span className="text-xs text-rose-700 font-bold truncate max-w-[100px]">
                          {user.name}
                        </span>
                      </div>
                      {user.id === socket?.id && <span className="text-[9px] font-black text-rose-300 uppercase">You</span>}
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

      <RomanticWidgets />
      <FloatingHearts />

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
          isHandInHand={isHandInHand}
          remoteCursors={remoteCursors}
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

      <MemoryVault 
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        roomId={roomId}
      />

      {/* Gift Boxes on Canvas (Only Unopened) */}
      {gifts.filter(g => !g.isOpened).map((gift, index) => (
        <GiftBox 
          key={gift._id || `canvas-gift-${index}`} 
          gift={gift} 
          onOpen={handleOpenGift} 
          onDelete={handleDeleteGift}
          isSender={gift.senderId === socket?.id}
        />
      ))}

      {/* Gift Popup / History */}
      <GiftPopup 
        isOpen={isGiftPopupOpen} 
        onClose={() => setIsGiftPopupOpen(false)} 
        onSend={handleSendGift}
        userName={userName}
        gifts={gifts}
        onOpenGift={handleOpenGift}
        onDeleteGift={handleDeleteGift}
        socketId={socket?.id}
      />

      <GiftRevealModal 
        gift={revealGift}
        isOpen={!!revealGift}
        onClose={() => setRevealGift(null)}
        userName={userName}
      />

      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto">
        <AnimatePresence>
          {isVibeOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
            >
              <VibeTracker 
                currentVibe={currentVibe}
                onVibeChange={(v) => {
                  setCurrentVibe(v);
                  socket.emit('cursor-move', { roomId, userName, position: mousePos, vibe: v });
                  setIsVibeOpen(false); // Close after selection
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CaptureModal 
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        imagePreview={capturePreview}
        onCapture={handleSaveToVault}
      />

      {/* Hand-in-Hand Mode: Linked Cursors Layer */}
      {isHandInHand && (
        <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {Object.entries(remoteCursors).map(([id, cursor]) => (
            id !== socket?.id && (
              <motion.line
                key={`line-${id}`}
                x1={mousePos.x}
                y1={mousePos.y}
                x2={cursor.position.x + panOffset.x}
                y2={cursor.position.y + panOffset.y}
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ filter: 'url(#glow)' }}
                className="stroke-rose-400 opacity-60"
              >
                <animate 
                  attributeName="stroke-dashoffset" 
                  from="0" 
                  to="100" 
                  dur="10s" 
                  repeatCount="indefinite" 
                />
              </motion.line>
            )
          ))}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f472b6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0.8" />
          </linearGradient>
        </svg>
      )}

      {/* Remote Cursors Presence Layer */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {Object.entries(remoteCursors).map(([id, cursor]) => {
          if (id === socket?.id) return null;
          const vibeData = VIBES.find(v => v.id === (cursor.vibe || 'happy')) || VIBES[0];
          
          return (
            <div 
              key={id}
              className="absolute transition-all duration-150"
              style={{ 
                left: cursor.position.x + panOffset.x, 
                top: cursor.position.y + panOffset.y 
              }}
            >
              <div className="relative">
                {/* Vibe Aura */}
                <div 
                  className="absolute -inset-4 rounded-full blur-xl opacity-40 animate-pulse"
                  style={{ backgroundColor: vibeData.aura }}
                />
                
                <svg width="24" height="24" viewBox="0 0 24 24" className="fill-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]">
                  <path d="M5.65355 17.3039L4.46228 5.23455C4.12402 1.80214 7.86834 -0.667797 10.6133 1.49053L20.2571 9.0712C23.002 11.2295 21.8484 15.6023 18.3371 16.1438L5.65355 17.3039Z" />
                </svg>
                
                <div className="absolute left-6 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/80 backdrop-blur-md px-3 py-1 text-[10px] font-black text-rose-600 shadow-md border border-rose-100">
                  <span className="text-xs">{vibeData.emoji}</span>
                  {cursor.userName}
                </div>

                {/* Vibe Trail Effect: Miss You */}
                {cursor.vibe === 'missyou' && (
                  <div className="absolute inset-0 pointer-events-none">
                     <div className="absolute top-0 left-0 text-[10px] animate-float-up-sm opacity-0" style={{ animationDelay: '0s' }}>❤️</div>
                     <div className="absolute top-0 left-0 text-[10px] animate-float-up-sm opacity-0" style={{ animationDelay: '0.5s' }}>💖</div>
                     <div className="absolute top-0 left-0 text-[10px] animate-float-up-sm opacity-0" style={{ animationDelay: '1s' }}>💗</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Reactions Layer */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div 
            key={r.id}
            className="absolute animate-bounce-fade text-3xl select-none"
            style={{ 
              left: r.position.x, 
              top: r.position.y,
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanvasRoom;
