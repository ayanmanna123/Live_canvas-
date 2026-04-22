import React, { useState } from 'react';
import { X, Sparkles, Wand2 } from 'lucide-react';
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
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-600/20 to-transparent pointer-events-none" />
        
        <div className="p-8 relative">
          <div className="flex justify-between items-start mb-8">
            <div className="size-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20">
              <Sparkles className="size-8 text-white" />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-slate-400 hover:text-white rounded-full hover:bg-white/5"
            >
              <X className="size-6" />
            </Button>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">New Canvas</h2>
            <p className="text-slate-400 font-medium">Give your masterpiece a name to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="canvas-name" className="text-xs font-black text-indigo-400 uppercase tracking-widest px-1">
                Canvas Name
              </label>
              <div className="relative group">
                <input
                  id="canvas-name"
                  type="text"
                  autoFocus
                  placeholder="e.g. Brainstorm Session #1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/5 focus:border-indigo-500/50 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 outline-none transition-all duration-300 font-bold text-lg"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 text-slate-500 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <Wand2 className="size-4" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="button"
                variant="ghost" 
                onClick={onClose}
                className="flex-1 py-7 rounded-2xl text-slate-400 font-bold hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-[2] py-7 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:brightness-110 shadow-2xl shadow-indigo-600/20 active:scale-[0.98] transition-all"
              >
                Create Canvas
              </Button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="bg-slate-950/50 p-6 border-t border-white/5">
          <p className="text-[10px] text-center text-slate-500 font-medium uppercase tracking-widest">
            Stored in Real-time Database
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewCanvasModal;
