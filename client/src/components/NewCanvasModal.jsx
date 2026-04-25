import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

const NewCanvasModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-rose-950/40 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white border border-rose-100 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-rose-100/50 to-transparent pointer-events-none" />
        
        <div className="p-10 relative">
          <div className="flex justify-between items-start mb-8">
            <div className="size-20 rounded-[2rem] bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-xl shadow-rose-200/50 heart-pulse">
              <Sparkles className="size-10 text-white" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-rose-50 text-rose-300 hover:text-rose-600 transition-all"
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-rose-600 mb-2 font-serif italic tracking-tight">New Chapter</h2>
            <p className="text-rose-400 font-bold uppercase tracking-widest text-[10px]">Designate a title for this shared reflection. ✨</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="canvas-name" className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-rose-400" />
                Chronicle Title
              </label>
              <div className="relative group">
                <input
                  id="canvas-name"
                  type="text"
                  autoFocus
                  placeholder="e.g. Initial Discovery"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-rose-50/30 border-2 border-rose-50 focus:border-rose-200 rounded-[1.5rem] px-6 py-5 text-rose-700 placeholder:text-rose-200 outline-none transition-all duration-300 font-bold text-xl shadow-inner"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-5 rounded-[1.5rem] text-rose-300 font-black uppercase tracking-widest text-xs hover:text-rose-500 hover:bg-rose-50 transition-all"
              >
                Defer
              </button>
              <button 
                type="submit"
                disabled={!name.trim()}
                className="flex-[2] py-5 rounded-[1.5rem] bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-xl shadow-rose-200/50 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Commence Journey
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="bg-rose-50/30 p-6 border-t border-rose-100">
          <p className="text-[10px] text-center text-rose-300 font-black uppercase tracking-[0.2em]">
            Archived within our private chronicles forever
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewCanvasModal;
