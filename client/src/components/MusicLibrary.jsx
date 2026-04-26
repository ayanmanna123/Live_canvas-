import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music2, Play, ListMusic, Loader2, PlayCircle, SkipForward, Music, Search, Upload, AlertCircle, Pause, SkipBack, Volume2 } from 'lucide-react';

const MusicLibrary = ({ 
  isOpen, 
  onClose, 
  onPlayTrack, 
  currentTrackUrl, 
  musicData, 
  playing, 
  setPlaying, 
  onSkipNext, 
  onSkipPrev,
  socket,
  roomId,
  volume,
  setVolume
}) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Upload States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({ title: '', artist: '' });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTracks();
    }
  }, [isOpen]);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/music/all`);
      if (response.ok) {
        const data = await response.json();
        setTracks(data);
      }
    } catch (error) {
      console.error('Failed to fetch music library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/music/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

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
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/music/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const track = await res.json();
        onPlayTrack(track, tracks);
        setShowUpload(false);
        setUploadFile(null);
        fetchTracks(); // Refresh library
      }
    } catch (e) { alert('Upload failed'); }
    setIsUploading(false);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      onPlayTrack(tracks[0], tracks);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-24 right-8 z-[110] w-[400px] bg-white/90 backdrop-blur-3xl rounded-[3rem] border border-white shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header - Current Player Stats */}
        <div className="p-6 bg-gradient-to-br from-rose-500 to-pink-500 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
             <Music className="size-32" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Music2 className="size-5" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Now Vibeing</h2>
                  <p className="text-sm font-black truncate max-w-[200px]">
                    {musicData?.title || 'No track selected'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-all">
                <X className="size-5" />
              </button>
            </div>

            {musicData?.url && (
              <div className="flex items-center gap-4 bg-black/10 rounded-[2rem] p-3 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2">
                  <button onClick={onSkipPrev} className="p-2 hover:scale-110 transition-transform"><SkipBack className="size-4" /></button>
                  <button 
                    onClick={() => {
                      const action = playing ? 'pause' : 'play';
                      setPlaying(!playing);
                      socket.emit('music-update', { roomId, action });
                    }}
                    className="size-10 rounded-full bg-white text-rose-500 flex items-center justify-center shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all"
                  >
                    {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-1" />}
                  </button>
                  <button onClick={onSkipNext} className="p-2 hover:scale-110 transition-transform"><SkipForward className="size-4" /></button>
                </div>
                <div className="flex-1 flex items-center gap-2 pr-2">
                   <Volume2 className="size-3 opacity-60" />
                   <input 
                     type="range" min="0" max="1" step="0.01" value={volume} 
                     onChange={(e) => setVolume(parseFloat(e.target.value))}
                     className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white" 
                   />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search & Upload Bar */}
        <div className="px-6 py-4 border-b border-rose-50 flex items-center gap-3 bg-white/50">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-300 group-focus-within:text-rose-400 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search collective library..."
              className="w-full bg-rose-50/30 border-2 border-transparent focus:border-rose-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-gray-700 placeholder:text-gray-300 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className={`size-11 rounded-2xl flex items-center justify-center transition-all ${showUpload ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-rose-50 text-rose-400 hover:bg-rose-100'}`}
            title="Upload New Music"
          >
            <Upload className="size-5" />
          </button>
        </div>

        {/* Library Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {showUpload ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-rose-600">Sync New Track</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Share your vibe with everyone</p>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <label className="block w-full cursor-pointer group">
                  <div className={`w-full bg-rose-50/30 border-2 border-dashed rounded-3xl p-8 transition-all ${uploadFile ? 'border-rose-400 bg-rose-50' : 'border-rose-100 group-hover:border-rose-300'}`}>
                    <div className="flex flex-col items-center gap-3">
                      <Upload className={`size-8 ${uploadFile ? 'text-rose-500 animate-bounce' : 'text-rose-200'}`} />
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest text-center max-w-[200px] truncate">
                        {uploadFile ? uploadFile.name : 'Choose Audio File'}
                      </span>
                    </div>
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => setUploadFile(e.target.files[0])} />
                  </div>
                </label>

                <div className="grid grid-cols-1 gap-2">
                  <input 
                    type="text" placeholder="Song Title" value={uploadMeta.title} 
                    onChange={e => setUploadMeta(m => ({ ...m, title: e.target.value }))}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-rose-100 outline-none" 
                  />
                  <input 
                    type="text" placeholder="Artist Name" value={uploadMeta.artist} 
                    onChange={e => setUploadMeta(m => ({ ...m, artist: e.target.value }))}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-rose-100 outline-none" 
                  />
                </div>

                <button 
                  disabled={isUploading || !uploadFile}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 disabled:opacity-50 hover:brightness-110 transition-all flex items-center justify-center gap-3"
                >
                  {isUploading ? <><Loader2 className="size-4 animate-spin" /> Synchronizing...</> : 'Upload & Start Vibe'}
                </button>
              </form>
            </motion.div>
          ) : isSearching ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="size-8 text-rose-500 animate-spin" />
                <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Searching the hub...</p>
             </div>
          ) : (
            <div className="space-y-6">
              {/* Search Results if any */}
              {searchResults.length > 0 && searchQuery && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                    Search Results <span className="size-1.5 rounded-full bg-rose-400" />
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {searchResults.map(track => (
                      <button 
                        key={track._id} 
                        onClick={() => onPlayTrack(track)}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-rose-50/50 hover:bg-rose-100/50 transition-all text-left group border border-rose-100/50"
                      >
                        <img src={track.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'} className="size-10 rounded-xl object-cover shadow-sm" alt="" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-black uppercase truncate">{track.title}</h4>
                          <p className="text-[9px] font-bold text-rose-400 uppercase">{track.artist}</p>
                        </div>
                        <Play className="size-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-rose-50 my-4" />
                </div>
              )}

              {/* Main Library */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hub Library</h3>
                <button onClick={handlePlayAll} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:scale-105 transition-transform flex items-center gap-1.5">
                  <Play className="size-3 fill-current" /> Play All
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="size-8 text-rose-500 animate-spin" />
                </div>
              ) : tracks.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {tracks.map((track, idx) => {
                    const isPlaying = currentTrackUrl === track.url;
                    return (
                      <button
                        key={track._id}
                        onClick={() => onPlayTrack(track, tracks)}
                        className={`group relative flex items-center gap-4 p-4 rounded-[2rem] transition-all ${isPlaying ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' : 'hover:bg-rose-50 bg-white border border-rose-50'}`}
                      >
                        <div className="relative size-12 shrink-0">
                          <img src={track.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'} className={`size-full object-cover rounded-2xl shadow-md ${isPlaying ? 'animate-pulse' : ''}`} alt="" />
                          {isPlaying ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                               <Pause className="size-5 fill-current" />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                               <PlayCircle className="size-6 fill-current" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                           <h4 className={`text-[11px] font-black uppercase truncate tracking-tight ${isPlaying ? 'text-white' : 'text-gray-800'}`}>{track.title}</h4>
                           <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isPlaying ? 'text-rose-100' : 'text-rose-400'}`}>{track.artist}</p>
                        </div>
                        <div className={`text-[8px] font-black px-2 py-1 rounded-full ${isPlaying ? 'bg-white/20' : 'bg-rose-50 text-rose-500'}`}>
                           {idx + 1}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-10">
                  <div className="size-16 rounded-full bg-rose-50 flex items-center justify-center"><Music className="size-8 text-rose-200" /></div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-gray-800 tracking-widest">Library Empty</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">No music shared yet.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/50 border-t border-rose-50 flex justify-center">
           <p className="text-[8px] font-black uppercase tracking-[0.3em] text-rose-300">Synchronized Eternal Radio</p>
        </div>

        <style jsx="true">{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(244, 63, 94, 0.1); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(244, 63, 94, 0.2); }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicLibrary;
