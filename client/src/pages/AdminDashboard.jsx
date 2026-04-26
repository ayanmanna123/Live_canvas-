import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import DrawingCanvas from '../components/DrawingCanvas';
import { Users, Layout, Eye, Shield, Activity, RefreshCw, X, Server, Database, ExternalLink, Clock, Calendar } from 'lucide-react';

const AdminDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [roomHistory, setRoomHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'history'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [stats, setStats] = useState({ totalRooms: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { socket, isConnected } = useSocket();
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/admin/active-rooms`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
        
        const users = data.reduce((acc, room) => acc + room.userCount, 0);
        setStats({ totalRooms: data.length, totalUsers: users });
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/admin/room-history`);
      if (response.ok) {
        const data = await response.json();
        setRoomHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchHistory();
    const interval = setInterval(() => {
      fetchRooms();
      if (activeTab === 'history') fetchHistory();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handlePreview = (room) => {
    if (selectedRoom?.roomId === room.roomId) return;
    
    // Clear previous room preview listeners if needed
    if (socket) {
      socket.off('canvas-history');
      socket.off('draw-remote');
      socket.off('active-canvas-update');
    }

    setSelectedRoom(room);
    if (socket) {
      socket.emit('admin-watch-room', { roomId: room.roomId });
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-white p-6 font-sans selection:bg-cyan-500/30 ${isFullScreen ? 'overflow-hidden' : ''}`}>
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <Shield className="size-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Control <span className="text-cyan-400">Center</span></h1>
              <p className="text-white/40 text-xs font-medium tracking-[0.2em] uppercase">Developer Access Only • Internal Systems</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <Activity className={`size-4 ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{isConnected ? 'System Live' : 'Disconnected'}</span>
            </div>
            <button 
              onClick={fetchRooms}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Server className="size-5" />} label="Active Hubs" value={stats.totalRooms} color="cyan" />
          <StatCard icon={<Users className="size-5" />} label="Live Entities" value={stats.totalUsers} color="purple" />
          <StatCard icon={<Clock className="size-5" />} label="Total Sessions" value={roomHistory.length} color="emerald" />
          <StatCard icon={<Activity className="size-5" />} label="Traffic Load" value="Optimal" color="orange" />
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[2rem] w-fit border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'text-white/40 hover:text-white'}`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-white/40 hover:text-white'}`}
          >
            History Logs
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main List Area */}
          <div className="xl:col-span-1 space-y-4">
            <AnimatePresence mode="wait">
              {activeTab === 'live' ? (
                <motion.div
                  key="live-list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                      <Layout className="size-4" /> Active Rooms
                    </h2>
                    <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10 text-white/40">{rooms.length} Running</span>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {rooms.map((room) => (
                      <motion.div
                        key={room.roomId}
                        layout
                        onClick={() => handlePreview(room)}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer group ${
                          selectedRoom?.roomId === room.roomId 
                            ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black tracking-widest text-white truncate max-w-[150px]">
                            {room.roomId}
                          </span>
                          <div className="flex items-center gap-1 text-cyan-400">
                            <Users className="size-3" />
                            <span className="text-[10px] font-black">{room.userCount}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {room.users.map((user, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] text-white/60">
                              {user}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="history-list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                      <Clock className="size-4" /> Recent Activity
                    </h2>
                    <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10 text-white/40">{roomHistory.length} Logs</span>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(
                      roomHistory.reduce((acc, log) => {
                        if (!acc[log.roomId]) acc[log.roomId] = [];
                        acc[log.roomId].push(log);
                        return acc;
                      }, {})
                    ).map(([room, logs]) => (
                      <div 
                        key={room}
                        className="p-4 rounded-[2rem] bg-white/5 border border-white/10 space-y-4 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center justify-between px-2">
                          <span className="text-[10px] font-black text-emerald-400 tracking-widest flex items-center gap-2">
                            <Layout className="size-3" /> {room}
                          </span>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-black uppercase">
                            {logs.length} SESSIONS
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {logs.slice(0, 5).map((log, lIdx) => (
                            <div key={lIdx} className="flex flex-col gap-1 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/70 font-bold">{log.userName}</span>
                                <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-white/30 uppercase font-black">
                                  {new Date(log.joinedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">In Time</span>
                                  <span className="text-[9px] text-emerald-400/80 font-mono">
                                    {new Date(log.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">Out Time</span>
                                  <span className={`text-[9px] font-mono ${log.leftAt ? 'text-rose-400/80' : 'text-cyan-400 animate-pulse'}`}>
                                    {log.leftAt 
                                      ? new Date(log.leftAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : 'STILL IN'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {logs.length > 5 && (
                            <p className="text-[8px] text-white/20 text-center font-black uppercase tracking-widest pt-2">
                              + {logs.length - 5} more entries
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Preview Panel */}
          <div className="xl:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                  <Eye className="size-4" /> Visual Monitor
                </h2>
                <div className="flex items-center gap-4">
                  {selectedRoom && (
                    <>
                      <button 
                        onClick={() => navigate(`/room/${selectedRoom.roomId}`)}
                        className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"
                      >
                        <ExternalLink className="size-3" /> Join Hub
                      </button>
                      <button 
                        onClick={() => setIsFullScreen(true)}
                        className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Layout className="size-3" /> Maximize
                      </button>
                      <button 
                        onClick={() => setSelectedRoom(null)}
                        className="text-[10px] text-red-400 font-bold uppercase tracking-widest hover:text-red-300 flex items-center gap-1"
                      >
                        <X className="size-3" /> Close Feed
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="aspect-video w-full rounded-[3rem] bg-[#0a0a0a] border border-white/5 overflow-hidden shadow-2xl relative group">
                <AnimatePresence mode="wait">
                  {selectedRoom ? (
                    <motion.div
                      key={selectedRoom.roomId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      {/* Read-only canvas for preview */}
                      <div className="absolute inset-0 pointer-events-none scale-[1.0] origin-center opacity-60 grayscale-[0.2]">
                        <DrawingCanvas 
                          ref={canvasRef}
                          roomId={selectedRoom.roomId}
                          canvasId="admin-preview" // Special ID to avoid conflicts
                          userName="Admin-Ghost"
                          color="#000000"
                          bgColor="#050505"
                          size={5}
                          tool="pencil"
                          readOnly={true} // We need to add this prop to DrawingCanvas
                        />
                      </div>

                      {/* Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 p-8 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-2xl flex items-center gap-2">
                            <div className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Live Stream • {selectedRoom.roomId}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            {selectedRoom.movie?.url && (
                              <div className="bg-purple-500/20 backdrop-blur-md border border-purple-500/30 px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-2 uppercase tracking-widest">
                                🎬 Movie Session Active
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.3em]">Telemetry Data</p>
                          <div className="flex gap-6">
                            <DataPoint label="Users" value={selectedRoom.userCount} />
                            <DataPoint label="Canvas" value="Default" />
                            <DataPoint label="Load" value="Low" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 space-y-4">
                      <Layout className="size-24 stroke-[0.5px]" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Select a hub to initialize uplink</p>
                    </div>
                  )}
                </AnimatePresence>

                {/* Scanning line effect */}
                {selectedRoom && (
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-scan z-20 pointer-events-none" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {isFullScreen && selectedRoom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center p-4"
          >
            <div className="relative w-full h-full max-w-6xl aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(6,182,212,0.15)]">
              {/* Canvas Preview */}
              <div className="absolute inset-0 grayscale-[0.2] opacity-80">
                <DrawingCanvas 
                  roomId={selectedRoom.roomId}
                  canvasId="admin-preview-fs"
                  userName="Admin-Ghost"
                  color="#000000"
                  bgColor="#050505"
                  size={5}
                  tool="pencil"
                  readOnly={true}
                />
              </div>

              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 p-12 flex flex-col justify-between pointer-events-none">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/30 px-6 py-3 rounded-3xl flex items-center gap-3">
                      <div className="size-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                      <span className="text-xs font-black tracking-[0.2em] uppercase">Visual Uplink Established • {selectedRoom.roomId}</span>
                    </div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em] px-4">Satellite Feed Secure</p>
                  </div>

                  <div className="flex items-center gap-4 pointer-events-auto">
                    <button 
                      onClick={() => navigate(`/room/${selectedRoom.roomId}`)}
                      className="px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-500/30 transition-all flex items-center gap-2"
                    >
                      <ExternalLink className="size-4" /> Enter Room
                    </button>
                    <button 
                      onClick={() => setIsFullScreen(false)}
                      className="p-4 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all group shadow-2xl"
                    >
                      <X className="size-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="space-y-4">
                    <div className="flex gap-12">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/60 block">Live Subjects</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedRoom.users.map((u, i) => (
                            <span key={i} className="text-sm font-black uppercase italic text-white/90">{u}{i < selectedRoom.users.length - 1 ? ',' : ''}</span>
                          ))}
                        </div>
                      </div>
                      <DataPoint label="Signal" value="Encrypted" />
                      <DataPoint label="Latency" value="12ms" />
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/60 block mb-1">System Time</span>
                    <span className="text-xl font-mono font-black text-white/20">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Scanning line effect */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-scan z-20 pointer-events-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @keyframes scan {
          0% { top: 0% }
          100% { top: 100% }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/5',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20 shadow-orange-500/5'
  };

  return (
    <div className={`p-5 rounded-[2.5rem] border ${colors[color]} shadow-lg backdrop-blur-sm`}>
      <div className="flex items-center gap-3 mb-4 opacity-60">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-black tracking-tighter uppercase italic">{value}</div>
    </div>
  );
};

const DataPoint = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{label}</span>
    <span className="text-xs font-black uppercase text-white/80">{value}</span>
  </div>
);

export default AdminDashboard;
