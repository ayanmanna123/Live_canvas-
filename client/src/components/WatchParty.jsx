import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { X, Link2, MonitorPlay, Crown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WatchParty = ({ isOpen, onClose, roomId, socket, url, setUrl, playing, setPlaying, currentTime, setCurrentTime, masterId }) => {
  const [inputUrl, setInputUrl] = useState(url || '');
  const playerRef = useRef(null);
  const nativeRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  // Helper to determine if we should use native player
  const shouldUseNative = (url) => {
    if (!url) return false;
    const directPatterns = ['googleusercontent.com', 'googlevideo.com', '.mp4', '.webm', '.ogg', 'firebasestorage'];
    return directPatterns.some(p => url.toLowerCase().includes(p)) || !ReactPlayer.canPlay(url);
  };

  const isNative = shouldUseNative(url);

  // Sync internal input when external URL changes
  useEffect(() => {
    if (url) setInputUrl(url);
  }, [url]);

  // Handle Remote Sync Effects
  useEffect(() => {
    if (!socket) return;

    const handleRemoteUpdate = (data) => {
      isRemoteUpdate.current = true;
      
      if (data.action === 'play') {
        if (isNative) nativeRef.current?.play().catch(() => {});
      } else if (data.action === 'pause') {
        if (isNative) nativeRef.current?.pause();
      } else if (data.action === 'seek') {
        if (isNative) {
          if (nativeRef.current) nativeRef.current.currentTime = data.currentTime;
        } else {
          playerRef.current?.seekTo(data.currentTime, 'seconds');
        }
      }
      
      setTimeout(() => { isRemoteUpdate.current = false; }, 500);
    };

    const handleGetMasterTime = ({ requesterId }) => {
      if (socket.id === masterId) {
        const time = isNative ? nativeRef.current?.currentTime : playerRef.current?.getCurrentTime();
        socket.emit('master-time-response', { requesterId, currentTime: time || 0 });
      }
    };

    const handleSyncToMaster = ({ currentTime: masterTime }) => {
      isRemoteUpdate.current = true;
      if (isNative) {
        if (nativeRef.current) nativeRef.current.currentTime = masterTime;
      } else {
        playerRef.current?.seekTo(masterTime, 'seconds');
      }
      setTimeout(() => { isRemoteUpdate.current = false; }, 500);
    };

    socket.on('movie-update-remote', handleRemoteUpdate);
    socket.on('get-master-time', handleGetMasterTime);
    socket.on('sync-to-master', handleSyncToMaster);
    
    return () => {
      socket.off('movie-update-remote', handleRemoteUpdate);
      socket.off('get-master-time', handleGetMasterTime);
      socket.off('sync-to-master', handleSyncToMaster);
    };
  }, [socket, url, masterId, isNative]);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!inputUrl) return;
    setUrl(inputUrl);
    socket.emit('movie-update', { roomId, url: inputUrl, action: 'url' });
  };

  const onPlay = () => {
    if (isRemoteUpdate.current) return;
    setPlaying(true);
    socket.emit('movie-update', { roomId, action: 'play' });
  };

  const onPause = () => {
    if (isRemoteUpdate.current) return;
    setPlaying(false);
    socket.emit('movie-update', { roomId, action: 'pause' });
  };

  const onSyncRequest = () => {
    socket.emit('request-master-sync', { roomId });
  };

  const handleSeek = (seconds) => {
    if (isRemoteUpdate.current) return;
    setCurrentTime(seconds);
    socket.emit('movie-update', { roomId, action: 'seek', currentTime: seconds });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-24 right-96 z-50 w-[480px] bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden touch-none"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-white/5 border-b border-white/5 cursor-move">
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-bold text-slate-200 uppercase tracking-widest">Watch Party</span>
            {socket.id === masterId && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Crown className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-500 uppercase">Master</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {url && socket.id !== masterId && (
              <button 
                onClick={onSyncRequest}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-indigo-400 border border-white/5 transition-all active:scale-95"
                title="Sync with Master"
              >
                <RefreshCw className="h-3 w-3" />
                SYNC
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* URL Input */}
        <div className="p-4 bg-black/20">
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste YouTube or Movie URL..."
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 transition-all">
              LOAD
            </button>
          </form>
        </div>

        {/* Player Area */}
        <div className="aspect-video bg-black relative">
          {url ? (
            isNative ? (
              <video 
                ref={nativeRef}
                src={url}
                className="w-full h-full"
                controls
                autoPlay={playing}
                preload="auto"
                onPlay={onPlay}
                onPause={onPause}
                onSeeked={(e) => handleSeek(e.target.currentTime)}
              />
            ) : (
              <ReactPlayer
                ref={playerRef}
                url={url}
                width="100%"
                height="100%"
                playing={playing}
                controls={true}
                playsinline
                config={{
                  file: {
                    forceVideo: true,
                    attributes: {
                      controlsList: 'nodownload'
                    }
                  }
                }}
                onPlay={onPlay}
                onPause={onPause}
                onSeek={handleSeek}
                onError={(e) => console.error('ReactPlayer Error:', e)}
              />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3">
               <div className="p-4 rounded-full bg-white/5 animate-pulse">
                  <MonitorPlay className="h-8 w-8 opacity-20" />
               </div>
               <p className="text-xs font-medium italic">No movie loaded yet...</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WatchParty;
