import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import DrawingCanvas from '../components/DrawingCanvas';
import Toolbar from '../components/Toolbar';
import Chat from '../components/Chat';
import { Share2, Users as UsersIcon, LogOut } from 'lucide-react';

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
  const [hasUnread, setHasUnread] = useState(false);
  const [showRopes, setShowRopes] = useState(true);
  const canvasRef = useRef(null);

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

    socket.on('receive-message', () => {
      if (!isChatOpen) {
        setHasUnread(true);
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

    return () => {
      socket.off('user-list-update');
      socket.off('cursor-move-remote');
      socket.off('background-changed');
      socket.off('notification');
    };
  }, [socket, roomId, userName]);

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas?')) {
      socket.emit('clear-canvas', roomId);
    }
  };

  const handleBgChange = (newColor) => {
    setBgColor(newColor);
    socket.emit('change-background', { roomId, color: newColor });
  };

  const handleSaveImage = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `live-canvas-${roomId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(roomId);
    setNotification('Room ID copied to clipboard!');
    setTimeout(() => setNotification(null), 2000);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ backgroundColor: bgColor }}>
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
        onSave={handleSaveImage}
        onShare={handleShare}
        userCount={users.length}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) setHasUnread(false);
        }}
        isChatOpen={isChatOpen}
        hasUnread={hasUnread}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        showRopes={showRopes}
        setShowRopes={setShowRopes}
      />

      {/* Sidebar - Users List & Leave Button */}
      <div className="absolute top-4 sm:top-24 left-4 sm:left-6 z-40 flex flex-col gap-3 pointer-events-none">
        {/* Active Users Card */}
        <div 
          className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 sm:bg-white/5 backdrop-blur-xl sm:backdrop-blur-md border border-white/10 shadow-2xl sm:shadow-xl pointer-events-auto transition-all duration-300"
        >
          <div 
            className="flex items-center gap-2 text-slate-400 cursor-pointer sm:cursor-default"
            onClick={() => window.innerWidth < 640 && setIsUsersListOpen(!isUsersListOpen)}
          >
            <div className="relative">
              <UsersIcon className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white ring-1 ring-slate-900 sm:hidden">
                {users.length}
              </span>
            </div>
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Active Users</span>
            <span className="sm:hidden text-xs font-bold text-slate-200">{users.length}</span>
          </div>

          {(isUsersListOpen || window.innerWidth >= 640) && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${user.id === socket?.id ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                  <span className="text-sm text-slate-200 truncate font-medium max-w-[120px]">
                    {user.name} {user.id === socket?.id && '(You)'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Room Button */}
        <button 
          onClick={() => navigate('/')}
          className={`group flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/80 sm:bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/10 sm:border-white/5 hover:border-red-500/20 transition-all pointer-events-auto font-medium text-sm backdrop-blur-xl sm:backdrop-blur-none ${!isUsersListOpen && window.innerWidth < 640 ? 'w-10 h-10' : 'w-full'}`}
          title="Leave Room"
        >
          <LogOut className="h-4 w-4" />
          {(isUsersListOpen || window.innerWidth >= 640) && <span>Leave Room</span>}
        </button>
      </div>

      {/* Chat Sidebar */}
      <Chat 
        socket={socket}
        roomId={roomId}
        userName={userName}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Drawing Canvas */}
      <DrawingCanvas 
        ref={canvasRef}
        roomId={roomId} 
        userName={userName}
        color={color}
        bgColor={bgColor}
        size={size}
        tool={tool}
        onPan={setPanOffset}
        showRopes={showRopes}
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
