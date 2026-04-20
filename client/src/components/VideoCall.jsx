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
      className={`fixed z-[100] bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${isMinimized ? 'w-48 h-12' : 'w-80 sm:w-96'}`}
      style={{ resize: isMinimized ? 'none' : 'both', minWidth: '320px', minHeight: '240px' }}
    >
      {/* Header / Drag Handle */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5 cursor-move">
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-slate-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Video Call</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-3 w-3 text-slate-400" /> : <Minimize2 className="h-3 w-3 text-slate-400" />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Video Grid */}
          <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] custom-scrollbar bg-slate-950/50">
            {/* Local Video */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/5 ring-1 ring-indigo-500/30">
              <video
                ref={(ref) => { if (ref) ref.srcObject = localStream; }}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
              />
              {isVideoMuted && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                    <VideoOff className="h-6 w-6 text-slate-500" />
                  </div>
                </div>
              )}
              {isScreenSharing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-600/20 backdrop-blur-sm">
                  <MonitorUp className="h-8 w-8 text-indigo-400 mb-2 animate-bounce" />
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Sharing Screen</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-md text-[10px] font-bold text-white">
                You {isAudioMuted && <MicOff className="inline h-3 w-3 ml-1 text-red-400" />}
              </div>
            </div>

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([peerId, data]) => (
              <div key={peerId} className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/5">
                <video
                  ref={(ref) => { if (ref) ref.srcObject = data.stream; }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-md text-[10px] font-bold text-white">
                  {data.userName}
                </div>
              </div>
            ))}
            
            {Object.keys(remoteStreams).length === 0 && (
              <div className="aspect-video bg-white/5 border border-dashed border-white/10 rounded-2xl flex items-center justify-center">
                <p className="text-[10px] font-medium text-slate-500 text-center px-4">Waiting for others to join...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 flex items-center justify-center gap-3 bg-white/5 border-t border-white/10">
            <Button
              variant="tonal"
              size="icon"
              onClick={toggleAudio}
              className={`rounded-2xl transition-all ${isAudioMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            >
              {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="tonal"
              size="icon"
              onClick={toggleVideo}
              className={`rounded-2xl transition-all ${isVideoMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            >
              {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="tonal"
              size="icon"
              onClick={onToggleScreenShare}
              className={`rounded-2xl transition-all ${isScreenSharing ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            >
              <MonitorUp className="h-5 w-5" />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={onEndCall}
              className="rounded-2xl bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20"
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
