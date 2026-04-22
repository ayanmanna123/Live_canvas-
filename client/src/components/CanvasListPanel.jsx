import React from 'react';
import { X, Layout, Plus, Clock, User, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const CanvasListPanel = ({ isOpen, onClose, canvases, activeCanvasId, onSwitch, onNew }) => {
  return (
    <div 
      className={`fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 z-[70] transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[20px_0_50px_rgba(0,0,0,0.5)]`}
    >
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Layout className="size-5" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Your Canvases</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white rounded-full hover:bg-white/5">
          <X className="size-5" />
        </Button>
      </div>

      <div className="p-4 space-y-3 h-[calc(100%-140px)] overflow-y-auto custom-scrollbar">
        <button 
          onClick={onNew}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-indigo-600 hover:brightness-110 active:scale-[0.98] transition-all text-white shadow-lg shadow-indigo-600/20 mb-4 group"
        >
          <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="size-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Create New</p>
            <p className="text-[10px] text-white/70">Start a fresh session</p>
          </div>
        </button>

        <div className="space-y-2">
          <p className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Previous Canvases</p>
          {canvases.map((canvas) => {
            const isActive = canvas._id === activeCanvasId;
            return (
              <button
                key={canvas._id}
                onClick={() => {
                  onSwitch(canvas._id);
                  onClose();
                }}
                className={`w-full group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-indigo-600/10 border-indigo-500/50 shadow-inner' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
              >
                <div className={`size-12 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/40' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                  <Layout className="size-6" />
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <h3 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {canvas.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <Clock className="size-3" />
                      {new Date(canvas.createdAt).toLocaleDateString()}
                    </div>
                    {canvas.createdBy && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
                        <User className="size-3" />
                        {canvas.createdBy}
                      </div>
                    )}
                  </div>
                </div>

                {isActive ? (
                   <div className="size-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                ) : (
                  <ChevronRight className="size-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 to-transparent">
        <p className="text-[10px] text-center text-slate-500 font-medium">
          Multi-canvas sessions are stored automatically.
        </p>
      </div>
    </div>
  );
};

export default CanvasListPanel;
