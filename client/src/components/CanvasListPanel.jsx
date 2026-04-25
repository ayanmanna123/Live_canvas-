import React from 'react';
import { X, Layout, Plus, Clock, User, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const CanvasListPanel = ({ isOpen, onClose, canvases, activeCanvasId, onSwitch, onNew }) => {
  return (
    <div 
      className={`fixed top-0 left-0 h-full w-80 glass backdrop-blur-2xl border-r border-rose-100 z-[70] transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[20px_0_50px_rgba(255,182,193,0.15)]`}
    >
      <div className="flex items-center justify-between p-6 border-b border-rose-100 bg-rose-50/50">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <h2 className="text-[11px] font-black text-rose-600 uppercase tracking-[0.2em] font-sans">Journey Archive 🏛️</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-rose-100 text-rose-300 hover:text-rose-600 transition-all"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="p-5 space-y-3 h-[calc(100%-140px)] overflow-y-auto custom-scrollbar bg-rose-50/10">
        <button 
          onClick={onNew}
          className="w-full flex items-center gap-4 p-5 rounded-[2rem] bg-gradient-to-tr from-rose-400 to-pink-500 hover:brightness-110 active:scale-[0.98] transition-all text-white shadow-lg shadow-rose-200/50 mb-6 group"
        >
          <div className="size-11 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <Plus className="size-6 stroke-[3px]" />
          </div>
          <div className="text-left">
            <p className="font-black text-xs uppercase tracking-widest">Begin Chapter</p>
            <p className="text-[10px] text-rose-50 font-bold opacity-80">Initialize fresh session</p>
          </div>
        </button>

        <div className="space-y-3">
          <p className="px-2 text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-4">Archived Memories</p>
          {canvases.map((canvas) => {
            const isActive = canvas._id === activeCanvasId;
            return (
              <button
                key={canvas._id}
                onClick={() => {
                  onSwitch(canvas._id);
                  onClose();
                }}
                className={`w-full group flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all duration-300 ${isActive ? 'bg-white border-rose-200 shadow-md ring-4 ring-rose-50' : 'bg-white/40 border-transparent hover:bg-white/60 hover:border-rose-50'}`}
              >
                <div className={`size-11 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-gradient-to-br from-rose-400 to-pink-400 text-white shadow-lg' : 'bg-rose-50 text-rose-300 group-hover:bg-rose-100 group-hover:text-rose-400'}`}>
                  <Layout className="size-5" />
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <h3 className={`font-black text-xs truncate uppercase tracking-tight ${isActive ? 'text-rose-700' : 'text-rose-600'}`}>
                    {canvas.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 opacity-60">
                    <div className="flex items-center gap-1 text-[9px] text-rose-400 font-black">
                      <Clock className="size-3" />
                      {new Date(canvas.createdAt).toLocaleDateString()}
                    </div>
                    {canvas.createdBy && (
                      <div className="flex items-center gap-1 text-[9px] text-rose-400 font-black truncate max-w-[80px]">
                        <User className="size-3" />
                        {canvas.createdBy}
                      </div>
                    )}
                  </div>
                </div>

                {isActive ? (
                   <div className="size-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                ) : (
                  <ChevronRight className="size-4 text-rose-200 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-sm border-t border-rose-50">
        <p className="text-[9px] text-center text-rose-400 font-black uppercase tracking-widest opacity-60 leading-relaxed">
          Chronicles are preserved within <br/> this synchronized space.
        </p>
      </div>
    </div>
  );
};

export default CanvasListPanel;
