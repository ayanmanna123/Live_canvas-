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
          const isAhead = timeToSeek > localTime;
          let rate = 1.0;
          
          if (diff <= 1.5) rate = isAhead ? 1.1 : 0.9;
          else if (diff <= 3) rate = isAhead ? 1.25 : 0.75;
          else rate = isAhead ? 1.5 : 0.5;
          
          setPlaybackRate(rate);
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
        className="fixed bottom-24 right-96 z-50 w-[480px] bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.3)] overflow-hidden touch-none"
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between bg-gradient-to-r from-rose-400 to-pink-500 text-white cursor-move">
          <div className="flex items-center gap-3">
            <MonitorPlay className="h-5 w-5 text-rose-100" />
            <span className="text-xs font-black uppercase tracking-widest">Watch Party</span>
            {socket.id === masterId && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Crown className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-500 uppercase">Master</span>
              </div>
            )}
            {playbackRate !== 1.0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/20 border border-white/30 rounded-full animate-pulse">
                <RefreshCw className="h-3 w-3 text-white rotate" />
                <span className="text-[10px] font-bold text-white uppercase">
                  Syncing ({playbackRate}x)...
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {url && socket.id !== masterId && (
              <button 
                onClick={onSyncRequest}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-black text-white border border-white/20 transition-all active:scale-95"
                title="Sync with Master"
              >
                <RefreshCw className="h-3 w-3" />
                SYNC
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* URL Input */}
        <div className="p-5 bg-rose-50/50 border-b border-rose-100">
          <form onSubmit={handleUrlSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-300" />
              <input 
                type="text" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste YouTube or Movie URL..."
                className="w-full bg-white/60 border border-rose-100 rounded-2xl pl-11 pr-4 py-3 text-sm text-rose-700 placeholder:text-rose-300 focus:ring-4 focus:ring-rose-200/50 outline-none transition-all font-medium"
              />
            </div>
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white text-xs font-black rounded-2xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-rose-200/50">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-300 bg-rose-50/20 gap-4">
               <div className="p-6 rounded-full bg-white/40 shadow-inner border border-white/60 animate-pulse">
                  <MonitorPlay className="h-10 w-10 text-rose-400 opacity-60" />
               </div>
               <p className="text-xs font-black uppercase tracking-widest">No movie loaded yet...</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WatchParty;
