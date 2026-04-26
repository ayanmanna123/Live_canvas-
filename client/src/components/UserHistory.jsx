import React from 'react';
import { X, History, Clock, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { getUserColor } from '../lib/userColor';

const UserHistoryPanel = ({ history, isOpen, onClose }) => {
  if (!isOpen) return null;

  const formatTime = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getDuration = (joined, left) => {
    if (!left) return 'Active';
    const start = new Date(joined);
    const end = new Date(left);
    const diff = Math.floor((end - start) / 1000); // seconds
    
    if (diff < 60) return `${diff}s`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ${diff % 60}s`;
    
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const VIBE_EMOJIS = {
    happy: '😊',
    sad: '😢',
    love: '❤️',
    cool: '😎',
    angry: '😠',
    thinking: '🤔'
  };

  return (
    <div className="fixed inset-0 sm:inset-auto sm:top-24 sm:right-6 z-[60] sm:z-50 w-full sm:w-80 h-full sm:h-[calc(100vh-200px)] flex flex-col rounded-none sm:rounded-[2.5rem] glass shadow-2xl border-white/50 overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right-5 duration-700">
      {/* Header */}
      <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <h3 className="font-black text-[11px] text-rose-600 uppercase tracking-[0.2em] font-sans">Presence Journal 🖋️</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-rose-100 text-rose-300 hover:text-rose-600 transition-all"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-rose-50/20">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-rose-300 space-y-4 opacity-40">
            <History className="size-16 stroke-[1px] fill-rose-100" />
            <p className="text-[10px] font-black uppercase tracking-widest">No activity logs found</p>
          </div>
        )}
        
        {history.map((log, idx) => {
          const isActive = !log.leftAt;
          const uColor = getUserColor(log.userId);
          
          return (
            <div 
              key={log._id || idx} 
              className="p-4 rounded-[2rem] bg-white/60 border border-rose-100 space-y-3 hover:bg-white/80 transition-all group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: uColor, backgroundColor: uColor }} />
                  <span className="text-xs font-black text-rose-900 uppercase tracking-tight">{log.userName}</span>
                  {log.vibe && (
                    <span className="text-[10px]" title={`Joined while feeling ${log.vibe}`}>
                      {VIBE_EMOJIS[log.vibe] || '✨'}
                    </span>
                  )}
                </div>
                {isActive ? (
                  <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                    <CheckCircle2 className="size-3" /> Active
                  </span>
                ) : (
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-tighter">
                    Offline
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                  <LogIn className="size-3 text-rose-400" />
                  <span>{formatTime(log.joinedAt)}</span>
                </div>
                {log.leftAt && (
                   <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                    <LogOut className="size-3 text-pink-400" />
                    <span>{formatTime(log.leftAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[9px] text-rose-400 font-black uppercase tracking-tighter pt-2 border-t border-rose-100/50">
                <Clock className="size-3" />
                <span>Duration: {getDuration(log.joinedAt, log.leftAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 bg-white/60 text-center border-t border-rose-100 backdrop-blur-md">
        <p className="text-[9px] text-rose-400 font-black uppercase tracking-[0.2em]">Chronicles are preserved within this space</p>
      </div>
    </div>
  );
};

export default UserHistoryPanel;
