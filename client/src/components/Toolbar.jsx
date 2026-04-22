import React, { useState } from 'react';
import { Pencil, Eraser, Trash2, Save, Users, Share2, MessageSquare, Highlighter, Sparkles, Type, Undo2, Redo2, Menu, X, Hand, CircleDot, PaintBucket, Spline, History, Video, CheckCircle2, CloudSync, Wand2, Film, Gamepad2, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Toolbar = ({ 
  color, setColor, 
  bgColor, setBgColor,
  size, setSize, 
  tool, setTool, 
  onClear, onSave, isSaving,
  userCount,
  onShare,
  onToggleChat,
  isChatOpen,
  unreadCount,
  onUndo,
  onRedo,
  showRopes,
  setShowRopes,
  onToggleHistory,
  isHistoryOpen,
  inCall,
  onToggleCall,
  autoMode,
  setAutoMode,
  onToggleWatchParty,
  isWatchPartyOpen,
  onOpenGames
}) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 640);
  
  const colors = [
    '#ffffff', '#6750A4', '#1C1B1F', '#ef4444', '#f97316', 
    '#10b981', '#06b6d4', '#3b82f6', '#d946ef'
  ];

  const sizes = [2, 5, 10, 20, 40];

  const brushes = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'pencil', icon: Pencil, label: 'Pencil' },
    { id: 'highlighter', icon: Highlighter, label: 'High' },
    { id: 'neon', icon: Sparkles, label: 'Neon' },
    { id: 'dotted', icon: CircleDot, label: 'Dot' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'pan', icon: Hand, label: 'Pan' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[60] flex flex-col items-center gap-4 pointer-events-none">
      {/* Tool & Color Selection Dock */}
      <div className="flex items-center gap-2 p-2 rounded-[2.5rem] glass premium-shadow pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 px-2 border-r border-white/5">
          {brushes.map((b) => {
            const isActive = tool === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setTool(b.id)}
                className={`group relative size-11 flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                title={b.label}
              >
                <b.icon className="size-5" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-[10px] font-bold text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {b.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-2 px-3 border-r border-white/5">
          <div className="flex gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`size-6 rounded-full border-2 transition-all duration-200 hover:scale-125 ${color === c ? 'border-white ring-2 ring-indigo-500/50 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="relative group size-8 rounded-full overflow-hidden border border-white/10 hover:border-indigo-500 transition-colors">
            <input 
              type="color" 
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
            />
            <PaintBucket className="absolute inset-0 m-auto size-3 text-white pointer-events-none mix-blend-difference" />
          </div>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 px-2">
           <select 
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="bg-transparent text-slate-300 text-[11px] font-bold focus:outline-none cursor-pointer hover:text-white transition-colors appearance-none px-2"
            >
              {sizes.map(s => (
                <option key={s} value={s} className="bg-slate-900 text-white">{s}px</option>
              ))}
            </select>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-1 pl-2 border-l border-white/5">
          <button onClick={onUndo} className="size-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <Undo2 className="size-4" />
          </button>
          <button onClick={onRedo} className="size-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <Redo2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Secondary Actions Dock (History, Video, Chat, etc.) */}
      <div className="flex items-center gap-2 p-1.5 rounded-full glass-light pointer-events-auto animate-in slide-in-from-bottom-8 duration-700 delay-100">
        <button onClick={onToggleHistory} className={`size-10 flex items-center justify-center rounded-full transition-all ${isHistoryOpen ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Activity History">
          <History className="size-4" />
        </button>
        <button onClick={onToggleCall} className={`size-10 flex items-center justify-center rounded-full transition-all ${inCall ? "bg-red-500/20 text-red-400" : "text-slate-400 hover:text-white"}`} title="Video Call">
          <Video className="size-4" />
        </button>
        <button onClick={() => setShowRopes(!showRopes)} className={`size-10 flex items-center justify-center rounded-full transition-all ${showRopes ? "text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Toggle Ropes">
          <Spline className="size-4" />
        </button>
        <button onClick={() => setAutoMode(!autoMode)} className={`size-10 flex items-center justify-center rounded-full transition-all ${autoMode ? "text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Auto Shape">
          <Wand2 className={`size-4 ${autoMode ? 'animate-pulse' : ''}`} />
        </button>
        <button onClick={onToggleWatchParty} className={`size-10 flex items-center justify-center rounded-full transition-all ${isWatchPartyOpen ? "text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Watch Party">
          <Film className="size-4" />
        </button>
        <button onClick={onToggleChat} className="relative size-10 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-all" title="Chat">
          <MessageSquare className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 size-4 flex items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white ring-2 ring-slate-900">
              {unreadCount}
            </span>
          )}
        </button>
        <button onClick={onOpenGames} className="size-10 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-all" title="Games">
          <Gamepad2 className="size-4" />
        </button>
        <button onClick={onClear} className="size-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-400 transition-all" title="Clear All">
          <Trash2 className="size-4" />
        </button>
        <button onClick={onShare} className="ml-2 size-10 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:brightness-110 active:scale-95 transition-all" title="Share">
          <Share2 className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
