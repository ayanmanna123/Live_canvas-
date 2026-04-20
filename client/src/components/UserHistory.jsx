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

  return (
    <div className="fixed inset-0 sm:inset-auto sm:top-24 sm:right-6 z-[60] sm:z-40 w-full sm:w-80 h-full sm:h-[calc(100vh-120px)] flex flex-col rounded-none sm:rounded-3xl bg-slate-900/95 sm:bg-slate-900/80 backdrop-blur-2xl sm:backdrop-blur-xl border-none sm:border border-white/10 shadow-2xl ring-0 sm:ring-1 ring-white/10 overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right-5 duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Attendance Log</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
            <History className="h-8 w-8 opacity-20" />
            <p className="text-xs">No activity logs found.</p>
          </div>
        )}
        
        {history.map((log, idx) => {
          const isActive = !log.leftAt;
          const uColor = getUserColor(log.userId);
          
          return (
            <div 
              key={log._id || idx} 
              className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-indigo-500/5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: uColor, backgroundColor: uColor }} />
                  <span className="text-sm font-bold text-slate-100">{log.userName}</span>
                </div>
                {isActive ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    Offline
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <LogIn className="h-3 w-3 text-indigo-400" />
                  <span>{formatTime(log.joinedAt)}</span>
                </div>
                {log.leftAt && (
                   <div className="flex items-center gap-1 text-slate-400">
                    <LogOut className="h-3 w-3 text-rose-400" />
                    <span>{formatTime(log.leftAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-white/5">
                <Clock className="h-3 w-3" />
                <span>Duration: {getDuration(log.joinedAt, log.leftAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-white/5 text-center">
        <p className="text-[10px] text-slate-500 font-medium">Logs are persistent for each room</p>
      </div>
    </div>
  );
};

export default UserHistoryPanel;
