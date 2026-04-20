import React, { useState } from 'react';
import { Pencil, Eraser, Trash2, Download, Users, Share2, MessageSquare, Highlighter, Sparkles, Type, Undo2, Redo2, Menu, X, Hand, CircleDot, PaintBucket, Spline } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Toolbar = ({ 
  color, setColor, 
  bgColor, setBgColor,
  size, setSize, 
  tool, setTool, 
  onClear, onSave,
  userCount,
  onShare,
  onToggleChat,
  isChatOpen,
  hasUnread,
  onUndo,
  onRedo,
  showRopes,
  setShowRopes
}) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 640);
  
  const colors = [
    '#6750A4', '#1C1B1F', '#ef4444', '#f97316', '#f59e0b', 
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
  ];

  const sizes = [2, 5, 10, 15, 20];

  const brushes = [
    { id: 'pencil', icon: Pencil, label: 'Pencil' },
    { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
    { id: 'neon', icon: Sparkles, label: 'Neon' },
    { id: 'dotted', icon: CircleDot, label: 'Dotted' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'pan', icon: Hand, label: 'Pan' },
  ];

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-auto sm:right-auto sm:top-6 sm:left-1/2 sm:-translate-x-1/2 z-50 flex flex-col items-end sm:items-center gap-4">
      {/* Mobile Toggle Button - MD3 FAB Style */}
      <Button
        variant="fab"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden size-14 rounded-2xl z-50"
      >
        {isOpen ? <X className="size-6 text-white" /> : <Menu className="size-6 text-white" />}
      </Button>

      {/* Toolbar Content */}
      {isOpen && (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 sm:px-6 sm:py-3 rounded-3xl bg-md-surface-container/95 backdrop-blur-xl border border-md-outline/10 md-shadow-2 animate-in fade-in zoom-in duration-300 max-h-[75vh] sm:max-h-none overflow-y-auto sm:overflow-visible custom-scrollbar">
          
          {/* Tool Selection */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pb-4 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-md-outline/10 w-full sm:w-auto">
            {brushes.map((b) => {
              const isActive = tool === b.id;
              return (
                <Button
                  key={b.id}
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setTool(b.id)}
                  className={`size-10 ${isActive ? "md-shadow-1" : "text-md-on-surface-variant hover:bg-md-primary/10"}`}
                  title={b.label}
                >
                  <b.icon className="size-5" />
                </Button>
              );
            })}
          </div>

          {/* Color Selection */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-md-outline/10 w-full sm:w-auto">
            <div className="grid grid-cols-5 sm:flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 md-transition hover:scale-125 active:scale-95 ${color === c ? 'border-md-primary ring-2 ring-md-primary/20 scale-110 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                  title="Brush Color"
                />
              ))}
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-md-outline/10 ml-1">
              <div className="flex flex-col items-center gap-0.5" title="Background Color">
                <div className="relative group">
                  <input 
                    type="color" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-md-surface-container-low cursor-pointer p-0.5 border-2 border-md-outline/20 overflow-hidden md-transition hover:border-md-primary"
                  />
                  <div className="absolute -top-2 -right-2 bg-md-primary text-white p-1 rounded-md shadow-sm pointer-events-none">
                    <PaintBucket className="size-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Size Selection */}
          <div className="flex items-center justify-between sm:justify-start gap-4 pb-4 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-md-outline/10 w-full sm:w-auto">
            <span className="sm:hidden text-xs font-bold text-md-on-surface-variant uppercase tracking-wider">Size</span>
            <div className="flex items-center gap-1 bg-md-secondary-container/50 px-3 py-1 rounded-full border border-md-outline/5 hover:bg-md-secondary-container md-transition">
              <select 
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="bg-transparent text-md-on-secondary-container text-xs font-bold focus:outline-none cursor-pointer pr-1"
              >
                {sizes.map(s => (
                  <option key={s} value={s} className="bg-md-surface-container-low">{s}px</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <div className="flex items-center gap-1 sm:pr-2 sm:border-r border-md-outline/10 sm:mr-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onUndo}
                className="text-md-on-surface-variant hover:text-md-primary"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRedo}
                className="text-md-on-surface-variant hover:text-md-primary"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showRopes ? "tonal" : "ghost"}
                size="icon"
                onClick={() => setShowRopes(!showRopes)}
                className={showRopes ? "text-md-primary" : "text-md-on-surface-variant"}
                title={showRopes ? "Hide Ropes" : "Show Ropes"}
              >
                <Spline className="size-5" />
              </Button>

              <Button
                variant={isChatOpen ? "tonal" : "ghost"}
                size="icon"
                onClick={onToggleChat}
                className="relative"
                title="Chat"
              >
                <MessageSquare className="size-5" />
                {hasUnread && !isChatOpen && (
                  <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-md-tertiary border-2 border-md-surface-container animate-pulse" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="text-md-on-surface-variant hover:bg-red-500/10 hover:text-red-500"
                title="Clear Canvas"
              >
                <Trash2 className="size-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onSave}
                className="text-md-on-surface-variant"
                title="Save"
              >
                <Download className="size-5" />
              </Button>

              <Button
                variant="tonal"
                size="icon"
                onClick={onShare}
                className="rounded-full shadow-sm"
                title="Share Room"
              >
                <Share2 className="size-5" />
              </Button>
            </div>
          </div>

          {/* User Indicator */}
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-md-outline/10 ml-1">
            <div className="flex items-center gap-2 bg-md-primary/10 px-3 py-1.5 rounded-full border border-md-primary/10">
              <Users className="size-4 text-md-primary" />
              <span className="text-xs font-bold text-md-primary">{userCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
