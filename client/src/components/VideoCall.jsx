import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2, GripHorizontal, MonitorUp } from 'lucide-react';
import { Button } from './ui/button';

const VideoCall = ({ localStream, remoteStreams, onEndCall, toggleAudio, toggleVideo, isAudioMuted, isVideoMuted, isScreenSharing, onToggleScreenShare }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: 20, y: 100 }}
      className={`fixed z-[100] bg-white/80 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(244,63,94,0.3)] flex flex-col transition-all duration-300 ${isMinimized ? 'w-48 h-14' : 'w-80 sm:w-96'}`}
      style={{ resize: isMinimized ? 'none' : 'both', minWidth: '320px', minHeight: '240px' }}
    >
      {/* Header / Drag Handle */}
      <div className="flex items-center justify-between p-4 border-b border-rose-100 bg-rose-50/50 cursor-move">
        <div className="flex items-center gap-3">
          <GripHorizontal className="h-4 w-4 text-rose-300" />
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Video Call</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors text-rose-400"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Video Grid */}
          <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[400px] custom-scrollbar bg-rose-50/20">
            {/* Local Video */}
            <div className="relative aspect-video bg-rose-100/50 rounded-2xl overflow-hidden border-2 border-white ring-4 ring-rose-200/30">
              <video
                ref={(ref) => { if (ref) ref.srcObject = localStream; }}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
              />
              {isVideoMuted && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center bg-rose-50">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                    <VideoOff className="h-6 w-6 text-rose-300" />
                  </div>
                </div>
              )}
              {isScreenSharing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-500/20 backdrop-blur-sm">
                  <MonitorUp className="h-8 w-8 text-rose-500 mb-2 animate-bounce" />
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Sharing Screen</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full bg-rose-500/80 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest">
                You {isAudioMuted && <MicOff className="inline h-3 w-3 ml-1 text-white" />}
              </div>
            </div>

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([peerId, data]) => (
              <div key={peerId} className="relative aspect-video bg-rose-100/50 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                <video
                  ref={(ref) => { if (ref) ref.srcObject = data.stream; }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full bg-rose-500/80 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest">
                  {data.userName}
                </div>
              </div>
            ))}
            
            {Object.keys(remoteStreams).length === 0 && (
              <div className="aspect-video bg-white/40 border-2 border-dashed border-rose-100 rounded-2xl flex items-center justify-center">
                <p className="text-[10px] font-black text-rose-300 text-center px-6 uppercase tracking-widest">Waiting for your better half...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-5 flex items-center justify-center gap-3 bg-white/60 border-t border-rose-100 backdrop-blur-md">
            <Button
              variant="tonal"
              size="icon"
              onClick={toggleAudio}
              className={`rounded-[1.25rem] transition-all h-12 w-12 ${isAudioMuted ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
            >
              {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="tonal"
              size="icon"
              onClick={toggleVideo}
              className={`rounded-[1.25rem] transition-all h-12 w-12 ${isVideoMuted ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
            >
              {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="tonal"
              size="icon"
              onClick={onToggleScreenShare}
              className={`rounded-[1.25rem] transition-all h-12 w-12 ${isScreenSharing ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            >
              <MonitorUp className="h-5 w-5" />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={onEndCall}
              className="rounded-[1.25rem] h-12 w-12 bg-gradient-to-br from-rose-500 to-pink-600 text-white hover:brightness-110 shadow-lg shadow-rose-200"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default VideoCall;
