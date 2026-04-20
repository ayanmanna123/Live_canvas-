import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { X, Link2, MonitorPlay, Crown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WatchParty = ({ isOpen, onClose, roomId, socket, url, setUrl, playing, setPlaying, currentTime, setCurrentTime, masterId }) => {
  const [inputUrl, setInputUrl] = useState(url || '');
  const playerRef = useRef(null);
  const nativeRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

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

  // Handle Playback Rate for Native Video
  useEffect(() => {
    if (isNative && nativeRef.current) {
      nativeRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, isNative]);

  // Handle Remote Sync Effects
  useEffect(() => {
    if (!socket) return;

    const handleRemoteUpdate = (data) => {
      isRemoteUpdate.current = true;
      
      const targetAction = data.action;

      if (targetAction === 'play' || (data.playing && !targetAction)) {
        if (isNative) nativeRef.current?.play().catch(() => {});
        setPlaying(true);
      } else if (targetAction === 'pause' || (!data.playing && !targetAction && data.url)) {
        if (isNative) nativeRef.current?.pause();
        setPlaying(false);
      }
      
      if (targetAction === 'seek' || (!targetAction && data.currentTime > 0)) {
        const timeToSeek = data.currentTime;
        
        // Only seek if far away (> 5s) or if it's a manual seek action
        const localTime = isNative ? nativeRef.current?.currentTime : playerRef.current?.getCurrentTime();
        const diff = Math.abs(timeToSeek - (localTime || 0));
        
        if (targetAction === 'seek' || diff > 5) {
          if (isNative) {
            if (nativeRef.current) nativeRef.current.currentTime = timeToSeek;
          } else {
            playerRef.current?.seekTo(timeToSeek, 'seconds');
          }
          setPlaybackRate(1.0); // Reset rate on hard sync
        } else if (diff > 0.5 && socket.id !== masterId) {
          // Adaptive playback rate for small drifts
          setPlaybackRate(timeToSeek > localTime ? 1.1 : 0.9);
        } else {
          setPlaybackRate(1.0);
        }
      }
      
      setTimeout(() => { isRemoteUpdate.current = false; }, 500);
    };

    const handleGetMasterTime = ({ requesterId }) => {
      if (socket.id === masterId) {
        const time = isNative ? nativeRef.current?.currentTime : playerRef.current?.getCurrentTime();
        socket.emit('master-time-response', { requesterId, currentTime: time || 0, roomId });
      }
    };

    const handleSyncToMaster = ({ currentTime: masterTime }) => {
      isRemoteUpdate.current = true;
      if (isNative) {
        if (nativeRef.current) nativeRef.current.currentTime = masterTime;
      } else {
        playerRef.current?.seekTo(masterTime, 'seconds');
      }
      setPlaybackRate(1.0);
      setTimeout(() => { isRemoteUpdate.current = false; }, 500);
    };

    socket.on('movie-update-remote', handleRemoteUpdate);
    socket.on('get-master-time', handleGetMasterTime);
    socket.on('sync-to-master', handleSyncToMaster);
    
    const reportInterval = setInterval(() => {
      if (socket.id === masterId && url) {
        const time = isNative ? nativeRef.current?.currentTime : playerRef.current?.getCurrentTime();
        if (time > 0) {
          socket.emit('movie-time-report', { roomId, currentTime: time });
        }
      }
    }, 3000); // More frequent heartbeats for adaptive sync (3s)

    return () => {
      socket.off('movie-update-remote', handleRemoteUpdate);
      socket.off('get-master-time', handleGetMasterTime);
      socket.off('sync-to-master', handleSyncToMaster);
      clearInterval(reportInterval);
    };
  }, [socket, url, masterId, isNative, roomId]);

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

  const handleInitialSync = () => {
    if (currentTime > 0) {
      if (isNative) {
        if (nativeRef.current) nativeRef.current.currentTime = currentTime;
      } else {
        playerRef.current?.seekTo(currentTime, 'seconds');
      }
    }
    if (playing) {
      if (isNative) nativeRef.current?.play().catch(() => {});
    } else {
       if (isNative) nativeRef.current?.pause();
    }
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
            {playbackRate !== 1.0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full animate-pulse">
                <RefreshCw className="h-3 w-3 text-indigo-400 rotate" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Syncing...</span>
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
                playsInline
                onLoadedMetadata={handleInitialSync}
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
                playbackRate={playbackRate}
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
                onReady={handleInitialSync}
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
