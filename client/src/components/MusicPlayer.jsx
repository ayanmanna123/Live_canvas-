import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { X, Music, Search, Play, Pause, SkipForward, SkipBack, Volume2, ListMusic, Crown, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MusicPlayer = ({ isOpen, onClose, roomId, socket, musicData, setMusicData, playing, setPlaying, currentTime, setCurrentTime, masterId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const playerRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  // Sync with remote state
  useEffect(() => {
    if (!socket) return;

    const handleRemoteUpdate = (data) => {
      isRemoteUpdate.current = true;
      
      if (data.action === 'url' || data.url) {
        setMusicData({
          url: data.url,
          title: data.title,
          artist: data.artist,
          thumbnail: data.thumbnail
        });
      }

      if (data.action === 'play') setPlaying(true);
      else if (data.action === 'pause') setPlaying(false);
      
      if (data.action === 'seek' || (data.currentTime !== undefined && playerRef.current)) {
        try {
          const currentTime = typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() : 0;
          if (Math.abs(data.currentTime - currentTime) > 5) {
            playerRef.current.seekTo(data.currentTime, 'seconds');
          }
        } catch (e) {
          console.warn('Seek failed:', e);
        }
      }
      
      setTimeout(() => { isRemoteUpdate.current = false; }, 500);
    };

    socket.on('music-update-remote', handleRemoteUpdate);
    
    const reportInterval = setInterval(() => {
      if (socket.id === masterId && musicData?.url && playing && playerRef.current) {
        try {
          if (typeof playerRef.current.getCurrentTime === 'function') {
            const time = playerRef.current.getCurrentTime();
            if (time > 0) {
              socket.emit('music-time-report', { roomId, currentTime: time });
            }
          }
        } catch (e) {
          console.warn('Failed to get current time:', e);
        }
      }
    }, 5000);

    return () => {
      socket.off('music-update-remote', handleRemoteUpdate);
      clearInterval(reportInterval);
    };
  }, [socket, musicData, masterId, playing, roomId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Primary: Piped API (usually more stable and faster for music)
      const response = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(searchQuery)}&filter=music_videos`);
      if (!response.ok) throw new Error('Piped API failed');
      const data = await response.json();
      
      const formattedResults = data.items.map(item => ({
        id: item.url.split('v=')[1],
        title: item.title,
        artist: item.uploaderName,
        thumbnail: item.thumbnail,
        url: `https://www.youtube.com/watch?v=${item.url.split('v=')[1]}`,
        duration: item.duration
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.warn('Primary search failed, trying Invidious fallbacks...', error);
      
      const instances = [
        'https://inv.nadeko.net',
        'https://invidious.snopyta.org',
        'https://invidious.sethforprivacy.com',
        'https://invidious.flokinet.to'
      ];

      for (const instance of instances) {
        try {
          const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=video`);
          if (res.ok) {
            const results = await res.json();
            const formatted = results.map(video => ({
              id: video.videoId,
              title: video.title,
              artist: video.author,
              thumbnail: video.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${video.videoId}`,
              duration: video.lengthSeconds
            }));
            setSearchResults(formatted);
            setIsSearching(false);
            return;
          }
        } catch (e) {
          console.warn(`Instance ${instance} failed, trying next...`);
        }
      }

      // Final Fallback: iTunes Search API (Guaranteed to work, but only 30s previews)
      try {
        console.warn('All YouTube proxies failed, falling back to iTunes previews...');
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=15`);
        const itunesData = await itunesRes.json();
        const itunesFormatted = itunesData.results.map(item => ({
          id: item.trackId,
          title: item.trackName,
          artist: item.artistName,
          thumbnail: item.artworkUrl100.replace('100x100', '600x600'),
          url: item.previewUrl,
          duration: item.trackTimeMillis / 1000,
          is_preview: true
        }));
        setSearchResults(itunesFormatted);
      } catch (finalError) {
        console.error('All search methods failed:', finalError);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const playTrack = (track) => {
    const data = {
      roomId,
      url: track.url,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      action: 'url'
    };
    setMusicData(data);
    setPlaying(true);
    socket.emit('music-update', data);
    socket.emit('music-update', { roomId, action: 'play' });
  };

  const togglePlay = () => {
    const newPlaying = !playing;
    setPlaying(newPlaying);
    socket.emit('music-update', { roomId, action: newPlaying ? 'play' : 'pause' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: -20 }}
        className="fixed bottom-24 left-6 z-50 w-[400px] bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.3)] overflow-hidden flex flex-col max-h-[600px]"
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between bg-gradient-to-r from-rose-400 to-pink-500 text-white cursor-move shrink-0">
          <div className="flex items-center gap-3">
            <Music className="h-5 w-5 text-rose-100" />
            <span className="text-xs font-black uppercase tracking-widest">Romantic Radio</span>
            {socket.id === masterId && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full">
                <Crown className="h-3 w-3 text-amber-200" />
                <span className="text-[10px] font-bold text-amber-100 uppercase">DJ</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Track Info */}
        <div className="p-6 flex flex-col items-center gap-4 bg-rose-50/30 border-b border-rose-100/50 shrink-0">
          <div className="relative group">
            <div className={`size-32 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ${playing ? 'scale-105 shadow-rose-200' : 'scale-95 grayscale-[50%]'}`}>
              <img 
                src={musicData?.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop'} 
                alt="Album Art" 
                className={`w-full h-full object-cover ${playing ? 'animate-pulse-slow' : ''}`}
              />
              {playing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                   <div className="flex gap-1 items-end h-8">
                      {[1,2,3,4].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ height: [10, 25, 15, 30, 10] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                          className="w-1.5 bg-white rounded-full"
                        />
                      ))}
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-sm font-black text-rose-600 truncate max-w-[300px]">
              {musicData?.title || 'No song playing'}
            </h3>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
              {musicData?.artist || 'Select a track to start'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button className="text-rose-300 hover:text-rose-500 transition-colors">
              <SkipBack className="h-5 w-5 fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              disabled={!musicData?.url}
              className="size-14 flex items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
            </button>
            <button className="text-rose-300 hover:text-rose-500 transition-colors">
              <SkipForward className="h-5 w-5 fill-current" />
            </button>
          </div>

          <div className="w-full flex items-center gap-3">
             <Volume2 className="h-3 w-3 text-rose-300" />
             <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-rose-100 rounded-full appearance-none cursor-pointer accent-rose-500"
             />
          </div>
        </div>

        {/* Search Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-rose-100/50">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-300" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, artists..."
                className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-rose-700 placeholder:text-rose-300 focus:ring-4 focus:ring-rose-200/50 outline-none transition-all font-bold"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400 animate-spin" />
              )}
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {searchResults.length > 0 ? (
              searchResults.map((track) => (
                <button 
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all group ${musicData?.url === track.url ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'hover:bg-rose-50'}`}
                >
                  <div className="size-10 rounded-xl overflow-hidden shrink-0">
                    <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className={`text-[11px] font-black truncate ${musicData?.url === track.url ? 'text-white' : 'text-rose-600'}`}>
                      {track.title}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider truncate ${musicData?.url === track.url ? 'text-rose-100' : 'text-rose-300'}`}>
                      {track.artist}
                    </p>
                  </div>
                  <Play className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ${musicData?.url === track.url ? 'text-white' : 'text-rose-400'}`} />
                </button>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-rose-200 py-10">
                <ListMusic className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Search to find your vibe</p>
              </div>
            )}
          </div>

          {/* Manual Link Fallback */}
          <div className="p-4 bg-rose-50/20 border-t border-rose-100/30">
            <div className="relative group">
              <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-rose-300 group-focus-within:animate-spin" />
              <input 
                type="text"
                placeholder="Or paste YouTube / SoundCloud link..."
                className="w-full bg-white/40 border border-rose-100/50 rounded-xl pl-9 pr-4 py-2 text-[10px] text-rose-600 placeholder:text-rose-300 outline-none focus:ring-2 focus:ring-rose-200 transition-all font-bold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    playTrack({
                      url: e.target.value,
                      title: 'Custom Link',
                      artist: 'Manual Entry',
                      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop'
                    });
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Hidden Player - Re-organized for better compatibility */}
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {musicData?.url && (
            musicData.url.includes('apple.com') || musicData.url.endsWith('.m4a') || musicData.url.endsWith('.mp3') ? (
              <audio
                ref={(el) => {
                  if (el) {
                    // Manual sync for native audio
                    el.volume = volume;
                    if (playing) el.play().catch(e => console.error('Native Audio Play Error:', e));
                    else el.pause();
                  }
                }}
                src={musicData.url}
                onPlay={() => {
                  console.log('Native audio playing:', musicData.url);
                  if (!isRemoteUpdate.current) socket.emit('music-update', { roomId, action: 'play' });
                }}
                onPause={() => !isRemoteUpdate.current && socket.emit('music-update', { roomId, action: 'pause' })}
                onTimeUpdate={(e) => {
                  if (socket.id === masterId && playing) {
                    // Throttled time report
                    if (Math.floor(e.target.currentTime) % 5 === 0) {
                      socket.emit('music-time-report', { roomId, currentTime: e.target.currentTime });
                    }
                  }
                }}
                onError={(e) => console.error('Native Audio Error:', e)}
              />
            ) : (
              <ReactPlayer
                ref={playerRef}
                url={musicData?.url}
                playing={playing}
                volume={volume}
                muted={false}
                playsinline
                config={{
                  youtube: { playerVars: { autoplay: 1, controls: 0 } },
                  file: { forceAudio: true }
                }}
                onPlay={() => {
                  console.log('ReactPlayer playing:', musicData?.url);
                  if (!isRemoteUpdate.current) socket.emit('music-update', { roomId, action: 'play' });
                }}
                onPause={() => !isRemoteUpdate.current && socket.emit('music-update', { roomId, action: 'pause' })}
                onEnded={() => setPlaying(false)}
                onError={(e) => console.error('ReactPlayer Error:', e, 'URL:', musicData?.url)}
              />
            )
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicPlayer;
