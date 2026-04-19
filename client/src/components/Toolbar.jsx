import React, { useState } from 'react';
import { Pencil, Eraser, Trash2, Download, Users, Share2, MessageSquare, Highlighter, Sparkles, Type, Undo2, Redo2, ChevronUp, ChevronDown, Menu, X } from 'lucide-react';

const Toolbar = ({ 
  color, setColor, 
  size, setSize, 
  tool, setTool, 
  onClear, onSave,
  userCount,
  onShare,
  onToggleChat,
  isChatOpen,
  hasUnread,
  onUndo,
  onRedo
}) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 640);
  
  const colors = [
    '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#10b981', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
  ];

  const sizes = [2, 5, 10, 15, 20];

  const brushes = [
    { id: 'pencil', icon: Pencil, label: 'Pencil' },
    { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
    { id: 'neon', icon: Sparkles, label: 'Neon' },
    { id: 'dotted', icon: Type, label: 'Dotted' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  const activeBrush = brushes.find(b => b.id === tool) || brushes[0];

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-auto sm:right-auto sm:top-6 sm:left-1/2 sm:-translate-x-1/2 z-50 flex flex-col items-end sm:items-center gap-3">
      {/* Toggle Button - Hidden on Desktop */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`sm:hidden flex items-center justify-center p-3 rounded-2xl bg-indigo-600 text-white shadow-2xl hover:bg-indigo-500 transition-all active:scale-95 z-50`}
        title={isOpen ? "Close Toolbar" : "Open Toolbar"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="flex items-center gap-2">
            <activeBrush.icon className="h-6 w-6 text-white" />
            <Menu className="h-4 w-4 opacity-50" />
          </div>
        )}
      </button>

      {/* Toolbar Content */}
      {isOpen && (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 sm:px-6 sm:py-3 rounded-3xl sm:rounded-2xl bg-slate-900/90 sm:bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/5 max-h-[70vh] sm:max-h-none overflow-y-auto sm:overflow-visible custom-scrollbar animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-4 duration-300">
          {/* Tool Selection */}
          <div className="flex flex-col sm:flex-row items-center gap-1 pb-4 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-white/10 w-full sm:w-auto">
            {brushes.map((b) => (
              <button
                key={b.id}
                onClick={() => setTool(b.id)}
                className={`p-2.5 sm:p-2 rounded-xl sm:rounded-lg transition-all ${tool === b.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                title={b.label}
              >
                <b.icon className="h-5 w-5" />
              </button>
            ))}
          </div>

          {/* Color Selection */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pb-4 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-white/10 w-full sm:w-auto">
            <div className="grid grid-cols-5 sm:flex gap-2 sm:gap-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${color === c ? 'border-white ring-2 ring-indigo-500/50' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg bg-white/5 cursor-pointer p-1 border border-white/10 overflow-hidden"
              />
              <span className="sm:hidden text-[10px] font-bold text-slate-500 uppercase">Custom</span>
            </div>
          </div>

          {/* Size Selection */}
          <div className="flex items-center justify-between sm:justify-start gap-2 pb-4 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-white/10 w-full sm:w-auto">
            <span className="sm:hidden text-xs font-bold text-slate-400 uppercase">Size</span>
            <select 
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="bg-white/5 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg text-slate-300 text-sm font-bold focus:outline-none cursor-pointer hover:text-white transition-colors"
            >
              {sizes.map(s => (
                <option key={s} value={s} className="bg-slate-900">{s}px</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-row items-center gap-1 pt-2 sm:pt-0">
            <div className="flex items-center gap-1 sm:pr-2 sm:border-r border-white/10 sm:mr-1">
              <button
                onClick={onUndo}
                className="p-2.5 sm:p-2 rounded-xl sm:rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={onRedo}
                className="p-2.5 sm:p-2 rounded-xl sm:rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onToggleChat}
                className={`relative p-2.5 sm:p-2 rounded-xl sm:rounded-lg transition-all ${isChatOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-400 hover:bg-white/5'}`}
                title="Chat"
              >
                <MessageSquare className="h-5 w-5" />
                {hasUnread && !isChatOpen && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900" />
                )}
              </button>
              <button
                onClick={onClear}
                className="p-2.5 sm:p-2 rounded-xl sm:rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Clear Canvas"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={onSave}
                className="p-2.5 sm:p-2 rounded-xl sm:rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all"
                title="Save as Image"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={onShare}
                className="p-2.5 sm:p-2 rounded-xl sm:rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 transition-all"
                title="Share Room ID"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* User Indicator */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/10 ml-2">
            <div className="flex items-center justify-center bg-indigo-500/20 px-2 py-1 rounded-full border border-indigo-500/30">
              <Users className="h-3.5 w-3.5 text-indigo-400 mr-1.5" />
              <span className="text-xs font-bold text-indigo-300">{userCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
