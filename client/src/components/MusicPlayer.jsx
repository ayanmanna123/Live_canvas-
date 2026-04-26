import React, { useRef, useEffect } from 'react';

const MusicPlayer = ({ 
  roomId, 
  socket, 
  musicData, 
  playing, 
  masterId, 
  onTrackEnd,
  volume = 0.5
}) => {
  const audioRef = useRef(null);

  // --- Sync Volume ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // --- Time Reporting (Master Only) ---
  useEffect(() => {
    if (!socket) return;

    const interval = setInterval(() => {
      // If I am the master and I am playing, report my time
      if (socket.id === masterId && playing && audioRef.current) {
        const time = audioRef.current.currentTime;
        if (time > 0) {
          socket.emit('music-time-report', { roomId, currentTime: time });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [socket, masterId, playing, roomId]);

  // --- Remote Seeking Logic ---
  useEffect(() => {
    if (!socket) return;

    const handleRemoteUpdate = (data) => {
      // If it's a seek or a time report from master, and I'm not the master
      if ((data.action === 'seek' || data.currentTime !== undefined) && socket.id !== data.masterId) {
        if (audioRef.current) {
          const diff = Math.abs(data.currentTime - audioRef.current.currentTime);
          // Only sync if difference is significant (> 3 seconds) to avoid stuttering
          if (diff > 3) {
            audioRef.current.currentTime = data.currentTime;
          }
        }
      }
    };

    socket.on('music-update-remote', handleRemoteUpdate);
    return () => socket.off('music-update-remote', handleRemoteUpdate);
  }, [socket, masterId]);

  // --- Playback Control ---
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (playing) {
      // Attempt to play. Might fail due to browser auto-play policies.
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Autoplay prevented or audio error:", error);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [playing, musicData?.url]);

  return (
    <div className="hidden">
      {musicData?.url && (
        <audio 
          ref={audioRef} 
          src={musicData.url} 
          onEnded={onTrackEnd}
          autoPlay={playing}
        />
      )}
    </div>
  );
};

export default MusicPlayer;
