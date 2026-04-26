import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music2, Play, ListMusic, Loader2, PlayCircle, SkipForward, Music } from 'lucide-react';

const MusicLibrary = ({ isOpen, onClose, onPlayTrack, currentTrackUrl }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      onPlayTrack(tracks[0], tracks); // Pass the whole list as a playlist
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] w-[90vw] max-w-md bg-white/90 backdrop-blur-2xl rounded-[3rem] border border-rose-100 shadow-[0_20px_70px_-15px_rgba(244,63,94,0.3)] overflow-hidden flex flex-col max-h-[70vh]"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200 rotate-3">
              <ListMusic className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-rose-600 leading-none">Music Library</h2>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter mt-1">{tracks.length} Tracks Collective</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePlayAll}
              className="px-4 py-2 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 shadow-md shadow-rose-200"
            >
              <Play className="size-3 fill-current" /> Play All
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-rose-500 transition-all">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="size-8 text-rose-500 animate-spin" />
              <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Tuning the library...</p>
            </div>
          ) : tracks.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {tracks.map((track, index) => {
                const isPlaying = currentTrackUrl === track.url;
                return (
                  <motion.div
                    key={track._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onPlayTrack(track, tracks)}
                    className={`group relative flex items-center gap-4 p-3 rounded-[2rem] transition-all cursor-pointer ${isPlaying ? 'bg-rose-500 text-white shadow-xl shadow-rose-100' : 'hover:bg-rose-50 bg-white/50 border border-transparent hover:border-rose-100'}`}
                  >
                    <div className="relative size-12 shrink-0">
                      <img 
                        src={track.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200'} 
                        className={`size-full object-cover rounded-2xl shadow-md transition-transform group-hover:scale-105 ${isPlaying ? 'animate-pulse' : ''}`}
                        alt="" 
                      />
                      <div className={`absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <PlayCircle className="size-6 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[11px] font-black uppercase truncate tracking-tight ${isPlaying ? 'text-white' : 'text-gray-800'}`}>
                        {track.title}
                      </h4>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isPlaying ? 'text-rose-100' : 'text-rose-400'}`}>
                        {track.artist}
                      </p>
                    </div>

                    {isPlaying && (
                      <div className="pr-4">
                        <div className="flex gap-1 items-end h-3">
                          <motion.div animate={{ height: [4, 12, 6, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white rounded-full" />
                          <motion.div animate={{ height: [8, 4, 12, 4, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1 bg-white rounded-full" />
                          <motion.div animate={{ height: [12, 6, 12, 6, 12] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }} className="w-1 bg-white rounded-full" />
                        </div>
                      </div>
                    )}

                    <div className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${isPlaying ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-500'}`}>
                      {index + 1}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-10">
              <div className="size-16 rounded-full bg-rose-50 flex items-center justify-center">
                <Music className="size-8 text-rose-200" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-gray-800 tracking-widest">Library Empty</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">No music has been uploaded to this hub yet. Be the first to start the vibe!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-white/50 border-t border-rose-50 flex justify-center">
           <p className="text-[8px] font-black uppercase tracking-[0.3em] text-rose-300">Synchronized Eternal Radio</p>
        </div>

        <style jsx="true">{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(244, 63, 94, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(244, 63, 94, 0.2);
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicLibrary;
