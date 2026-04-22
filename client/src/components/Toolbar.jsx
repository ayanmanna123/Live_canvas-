import React, { useState } from 'react';
import { Pencil, Eraser, Trash2, Save, Users, Share2, MessageSquare, Highlighter, Sparkles, Type, Undo2, Redo2, Menu, X, Hand, CircleDot, PaintBucket, Spline, History, Video, CheckCircle2, CloudSync, Wand2, Film, Gamepad2 } from 'lucide-react';
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
    <>
      {/* Mobile Toggle Button - MD3 FAB Style */}
      <div className="fixed bottom-6 right-6 sm:hidden z-[60]">
        <Button
          variant="fab"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="size-14 rounded-2xl shadow-2xl bg-md-primary"
        >
          {isOpen ? <X className="size-6 text-white" /> : <Menu className="size-6 text-white" />}
        </Button>
      </div>

      {/* Top Center Toolbar - Brushes & Colors */}
      <div 
        className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out sm:block ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none sm:translate-y-0 sm:opacity-100 sm:pointer-events-auto'}`}
      >
        <div className="flex items-center gap-4 p-2 sm:px-6 sm:py-3 rounded-[2rem] bg-md-surface-container/90 backdrop-blur-2xl border border-md-outline/10 md-shadow-2">
          {/* Tool Selection */}
          <div className="flex items-center gap-1 pr-4 border-r border-md-outline/10">
            {brushes.map((b) => {
              const isActive = tool === b.id;
              return (
                <Button
                  key={b.id}
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setTool(b.id)}
                  className={`size-10 rounded-full transition-all duration-300 ${isActive ? "md-shadow-1 scale-110" : "text-md-on-surface-variant hover:bg-md-primary/10"}`}
                  title={b.label}
                >
                  <b.icon className="size-5" />
                </Button>
              );
            })}
          </div>

          {/* Color Selection */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5 px-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 md-transition hover:scale-125 active:scale-95 ${color === c ? 'border-md-primary ring-2 ring-md-primary/20 scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                  title="Brush Color"
                />
              ))}
            </div>
            
            <div className="flex items-center pl-4 border-l border-md-outline/10">
              <div className="relative group" title="Background Color">
                <input 
                  type="color" 
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-xl bg-md-surface-container-low cursor-pointer p-0.5 border-2 border-md-outline/20 overflow-hidden md-transition hover:border-md-primary"
                />
                <div className="absolute -top-1.5 -right-1.5 bg-md-primary text-white p-1 rounded-md shadow-sm pointer-events-none">
                  <PaintBucket className="size-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar Toolbar - Actions & Size */}
      <div 
        className={`fixed top-24 right-6 sm:right-8 z-50 transition-all duration-500 ease-out sm:block ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none sm:translate-y-0 sm:opacity-100 sm:pointer-events-auto'}`}
        style={{ 
          transform: isChatOpen && window.innerWidth >= 640 
            ? 'translateX(-340px)' 
            : undefined 
        }}
      >
        <div className="flex flex-col items-center gap-3 p-3 rounded-[2rem] bg-md-surface-container/90 backdrop-blur-2xl border border-md-outline/10 md-shadow-2">
          {/* Size Selection */}
          <div className="flex items-center bg-md-secondary-container/50 px-3 py-2 rounded-2xl border border-md-outline/5 hover:bg-md-secondary-container md-transition w-full justify-center">
            <select 
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="bg-transparent text-md-on-secondary-container text-sm font-bold focus:outline-none cursor-pointer"
            >
              {sizes.map(s => (
                <option key={s} value={s} className="bg-md-surface-container-low">{s}px</option>
              ))}
            </select>
          </div>

          {/* Undo/Redo Group */}
          <div className="flex flex-col items-center gap-1 py-3 border-y border-md-outline/10 w-full">
            <Button variant="ghost" size="icon" onClick={onUndo} title="Undo (Ctrl+Z)" className="text-md-on-surface-variant hover:text-md-primary">
              <Undo2 className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRedo} title="Redo (Ctrl+Y)" className="text-md-on-surface-variant hover:text-md-primary">
              <Redo2 className="size-5" />
            </Button>
          </div>

          {/* Utility Group */}
          <div className="flex flex-col items-center gap-2">
            <Button variant={isHistoryOpen ? "tonal" : "ghost"} size="icon" onClick={onToggleHistory} title="Activity History" className="rounded-full">
              <History className="size-5" />
            </Button>

            <Button variant={inCall ? "tonal" : "ghost"} size="icon" onClick={onToggleCall} title={inCall ? "Leave Call" : "Join Video Call"} className={`rounded-full ${inCall ? "text-md-primary" : "text-md-on-surface-variant"}`}>
              <Video className="size-5" />
            </Button>

            <Button variant={showRopes ? "tonal" : "ghost"} size="icon" onClick={() => setShowRopes(!showRopes)} title={showRopes ? "Hide Ropes" : "Show Ropes"} className={`rounded-full ${showRopes ? "text-md-primary" : "text-md-on-surface-variant"}`}>
              <Spline className="size-5" />
            </Button>

            <Button variant={autoMode ? "tonal" : "ghost"} size="icon" onClick={() => setAutoMode(!autoMode)} title={autoMode ? "Auto Mode: ON" : "Auto Mode: OFF"} className={`rounded-full ${autoMode ? "text-md-primary" : "text-md-on-surface-variant"}`}>
              <Wand2 className={`size-5 ${autoMode ? 'animate-pulse' : ''}`} />
            </Button>

            <Button variant={isWatchPartyOpen ? "tonal" : "ghost"} size="icon" onClick={onToggleWatchParty} title="Watch Party" className={`rounded-full ${isWatchPartyOpen ? "text-md-primary" : "text-md-on-surface-variant"}`}>
              <Film className="size-5" />
            </Button>

            <Button variant={isChatOpen ? "tonal" : "ghost"} size="icon" onClick={onToggleChat} className="relative rounded-full" title="Chat">
              <MessageSquare className="size-5" />
              {unreadCount > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-md-tertiary text-[10px] font-bold text-md-on-tertiary border-2 border-md-surface-container animate-in zoom-in duration-200">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            <Button variant="ghost" size="icon" onClick={onOpenGames} title="All Games" className="rounded-full text-md-on-surface-variant hover:text-md-primary">
              <Gamepad2 className="size-5" />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={onClear} className="text-md-on-surface-variant hover:bg-red-500/10 hover:text-red-500 rounded-full" title="Clear Canvas">
              <Trash2 className="size-5" />
            </Button>
            
            <Button variant={isSaving ? "tonal" : "ghost"} size="icon" onClick={onSave} className={`rounded-full ${isSaving ? "text-md-primary" : "text-md-on-surface-variant"}`} title={isSaving ? "Syncing..." : "Save Drawing"}>
              {isSaving ? <CloudSync className="size-5 animate-pulse" /> : <Save className="size-5" />}
            </Button>

            <div className="pt-2 border-t border-md-outline/10 w-full flex justify-center">
              <Button variant="tonal" size="icon" onClick={onShare} className="rounded-full shadow-sm bg-md-primary text-white hover:brightness-110 active:scale-95 transition-all" title="Share Room">
                <Share2 className="size-5" />
              </Button>
            </div>
          </div>

          {/* User Indicator */}
          <div className="hidden lg:flex flex-col items-center gap-1 bg-md-primary/10 p-2 rounded-2xl border border-md-primary/10 mt-1">
            <Users className="size-4 text-md-primary" />
            <span className="text-[10px] font-black text-md-primary leading-none">{userCount}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Toolbar;
