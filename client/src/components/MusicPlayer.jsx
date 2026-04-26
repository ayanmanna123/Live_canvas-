import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { X, Music, Search, Play, Pause, SkipForward, SkipBack, Volume2, ListMusic, Crown, Upload, Loader2, Music2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MusicPlayer = ({ isOpen, onClose, roomId, socket, musicData, setMusicData, playing, setPlaying, masterId, onTrackEnd, onSkipNext, onSkipPrev }) => {
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs
  const playerRef = useRef(null);
  const audioRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  // --- 1. Synchronization Logic ---
  useEffect(() => {
    if (!socket) return;

    const handleRemoteUpdate = (data) => {
      isRemoteUpdate.current = true;
      if (data.action === 'url') {
        setMusicData({ url: data.url, title: data.title, artist: data.artist, thumbnail: data.thumbnail });
      }
      if (data.action === 'play') setPlaying(true);
      if (data.action === 'pause') setPlaying(false);
      
      if (data.action === 'seek' || (data.currentTime !== undefined)) {
        const target = data.currentTime;
        if (playerRef.current?.getCurrentTime) {
          if (Math.abs(target - playerRef.current.getCurrentTime()) > 5) playerRef.current.seekTo(target);
        } else if (audioRef.current) {
          if (Math.abs(target - audioRef.current.currentTime) > 5) audioRef.current.currentTime = target;
        }
      }
      setTimeout(() => { isRemoteUpdate.current = false; }, 500);
    };

    socket.on('music-update-remote', handleRemoteUpdate);
    const interval = setInterval(() => {
      if (socket.id === masterId && playing) {
        const time = playerRef.current?.getCurrentTime?.() || audioRef.current?.currentTime || 0;
        if (time > 0) socket.emit('music-time-report', { roomId, currentTime: time });
      }
    }, 5000);

    return () => { socket.off('music-update-remote', handleRemoteUpdate); clearInterval(interval); };
  }, [socket, musicData, masterId, playing, roomId, setMusicData, setPlaying]);

  // --- 2. Playback Control ---
  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [playing, musicData?.url]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // --- 3. Search Logic ---
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    try {
      // ONLY Local Library
      const localRes = await fetch(`${API_BASE}/api/music/search?q=${encodeURIComponent(searchQuery)}`);
      const localData = await localRes.json();
      
      const results = localData.map(t => ({ 
        id: t._id, 
        title: t.title, 
        artist: t.artist, 
        thumbnail: t.thumbnail, 
        url: t.url, 
        source: 'Library' 
      }));

      setSearchResults(results);
    } catch (err) { 
      console.error('Library search error', err); 
    }
    setIsSearching(false);
  };

  const playTrack = (track) => {
    const data = { ...track, roomId, action: 'url' };
    setMusicData(data);
    setPlaying(true);
    socket.emit('music-update', data);
    socket.emit('music-update', { roomId, action: 'play' });
  };

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({ title: '', artist: '' });

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('audio', uploadFile);
    formData.append('title', uploadMeta.title);
    formData.append('artist', uploadMeta.artist);
    formData.append('uploadedBy', socket.id);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/music/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const track = await res.json();
        console.log('--- Music Uploaded to Backend ---');
        console.log('Stored Data:', track);
        playTrack({ url: track.url, title: track.title, artist: track.artist, thumbnail: track.thumbnail, source: 'Library' });
        setShowUpload(false);
      }
    } catch (e) { alert('Upload failed'); }
    setIsUploading(false);
  };


  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            drag 
            dragMomentum={false}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-8 z-[100] w-80 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100/50 bg-gradient-to-r from-rose-50 to-pink-50">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200">
                  <Music2 className="size-4 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter text-rose-600">Romantic Radio</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-rose-500 transition-all"><X className="size-4" /></button>
            </div>

            {/* Player View */}
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="relative size-40 group">
                <div className={`absolute inset-0 rounded-[2rem] bg-rose-200 blur-2xl opacity-20 transition-all duration-1000 ${playing ? 'scale-125 opacity-40' : 'scale-100'}`} />
                <div className={`relative size-full rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 ${playing ? 'scale-105 shadow-rose-200' : 'scale-95 grayscale-[50%]'}`}>
                  <img src={musicData?.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'} alt="" className="size-full object-cover" />
                </div>
              </div>

              <div className="space-y-1 w-full px-2">
                <h3 className="text-sm font-black text-gray-800 truncate uppercase tracking-tight">{musicData?.title || 'Waiting for music...'}</h3>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{musicData?.artist || 'Ready to vibe'}</p>
              </div>

              <div className="flex items-center gap-6 mt-2">
                <button 
                  onClick={onSkipPrev}
                  className="text-gray-300 hover:text-rose-400 transition-colors"
                >
                  <SkipBack className="size-5 fill-current" />
                </button>
                <button 
                  onClick={() => {
                    const action = playing ? 'pause' : 'play';
                    setPlaying(!playing);
                    socket.emit('music-update', { roomId, action });
                  }}
                  className="size-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-200 hover:scale-110 active:scale-95 transition-all"
                >
                  {playing ? <Pause className="size-6 fill-current" /> : <Play className="size-6 fill-current ml-1" />}
                </button>
                <button 
                  onClick={onSkipNext}
                  className="text-gray-300 hover:text-rose-400 transition-colors"
                >
                  <SkipForward className="size-5 fill-current" />
                </button>
              </div>

              <div className="w-full flex items-center gap-3 bg-rose-50/50 p-2 rounded-2xl">
                <Volume2 className="size-3 text-rose-300" />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="flex-1 h-1 bg-rose-100 rounded-full appearance-none cursor-pointer accent-rose-500" />
              </div>
            </div>

            {/* Search & Tabs */}
            <div className="flex-1 bg-white rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.02)] flex flex-col min-h-[300px]">
              <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-300 group-focus-within:text-rose-400 transition-colors" />
                  <input 
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search songs..." 
                    className="w-full bg-gray-50/50 border-none rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={() => setShowUpload(!showUpload)}
                  className={`p-2.5 rounded-xl transition-all ${showUpload ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}
                >
                  <Upload className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {showUpload ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-4 text-center">
                    <div className="space-y-1 mb-4">
                      <h4 className="text-[11px] font-black uppercase text-rose-600">Smart AI Upload</h4>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">We'll detect metadata & art automatically</p>
                    </div>

                    <form onSubmit={handleFileUpload} className="space-y-4">
                      <label className="block w-full cursor-pointer group">
                        <div className={`w-full bg-gray-50 border-2 border-dashed rounded-2xl p-6 transition-all ${uploadFile ? 'border-rose-400 bg-rose-50/50' : 'border-gray-100 group-hover:border-rose-200 group-hover:bg-gray-50'}`}>
                          <div className="flex flex-col items-center gap-2">
                            <Upload className={`size-6 ${uploadFile ? 'text-rose-500 animate-bounce' : 'text-rose-200'}`} />
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest truncate max-w-[200px] block">
                              {uploadFile ? uploadFile.name : 'Select Audio File'}
                            </span>
                          </div>
                          <input 
                            type="file" 
                            accept="audio/*" 
                            className="hidden"
                            onChange={(e) => setUploadFile(e.target.files[0])}
                          />
                        </div>
                      </label>

                      <div className="space-y-2 text-left opacity-40 hover:opacity-100 transition-opacity">
                        <p className="text-[7px] font-black text-gray-400 uppercase ml-1">Optional Overrides</p>
                        <input type="text" placeholder="Title (AI will guess if empty)" value={uploadMeta.title} onChange={e => setUploadMeta(m => ({ ...m, title: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-bold focus:ring-2 focus:ring-rose-100 outline-none" />
                        <input type="text" placeholder="Artist (AI will guess if empty)" value={uploadMeta.artist} onChange={e => setUploadMeta(m => ({ ...m, artist: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-bold focus:ring-2 focus:ring-rose-100 outline-none" />
                      </div>

                      <button 
                        disabled={isUploading || !uploadFile} 
                        className="w-full bg-rose-500 text-white text-[10px] font-black py-4 rounded-2xl shadow-lg shadow-rose-100 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            <span className="uppercase tracking-widest">AI is Processing...</span>
                          </>
                        ) : (
                          <span className="uppercase tracking-widest">Upload & Sync</span>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : isSearching ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="size-6 text-rose-200 animate-spin" />
                    <p className="text-[9px] font-black text-rose-200 uppercase tracking-widest">Searching everywhere...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((track, i) => (
                    <motion.button 
                      key={track.id + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => playTrack(track)}
                      className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all group ${musicData?.url === track.url ? 'bg-rose-500 text-white shadow-lg' : 'hover:bg-rose-50'}`}
                    >
                      <img src={track.thumbnail} className="size-9 rounded-xl object-cover shadow-sm" alt="" />
                      <div className="flex-1 text-left overflow-hidden">
                        <p className={`text-[10px] font-black truncate ${musicData?.url === track.url ? 'text-white' : 'text-gray-800'}`}>{track.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${musicData?.url === track.url ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>{track.source}</span>
                          <p className={`text-[8px] font-bold truncate ${musicData?.url === track.url ? 'text-rose-100' : 'text-gray-400'}`}>{track.artist}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-6">
                    <AlertCircle className="size-10 text-rose-100" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Music Not Available</p>
                      <p className="text-[9px] font-bold text-gray-300 uppercase leading-relaxed">This song isn't in our library yet.<br/>Would you like to upload it?</p>
                    </div>
                    <button 
                      onClick={() => setShowUpload(true)}
                      className="mt-2 px-6 py-2.5 rounded-full bg-rose-50 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
                    >
                      Upload to Library
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local Playback Engine - Always active in background */}
      <div className="hidden">
        {musicData?.url && (
          <audio 
            ref={audioRef} 
            src={musicData.url} 
            onEnded={() => {
              if (onTrackEnd) onTrackEnd();
              else setPlaying(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default MusicPlayer;
