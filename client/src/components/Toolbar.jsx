import React, { useState } from 'react';
import { Pencil, Eraser, Trash2, Share2, MessageSquare, Highlighter, Sparkles, Type, Undo2, Redo2, Hand, CircleDot, PaintBucket, Spline, History, Video, Wand2, Film, Gamepad2, MousePointer2, Image as ImageIcon, Grid3X3, Target, Shapes, Magnet, Smile, Sparkle, Heart, HeartOff, PenTool, StickyNote, Mail, Camera, Flower2, Stars, Paintbrush, LogOut, Plus, Layout, History as HistoryIcon } from 'lucide-react';
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
  onOpenGames,
  onImageUpload,
  showGrid, setShowGrid,
  snapToGrid, setSnapToGrid,
  onReaction
}) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 640);
  const [isReactionWheelOpen, setIsReactionWheelOpen] = useState(false);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/ai/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      if (!response.ok) throw new Error('AI generation failed');
      const data = await response.json();
      
      // Use the same image placement logic as manual upload
      // Create a dummy file object or just pass the URL if we modify handleImageUpload
      // Actually, it's easier to just pass the URL back to CanvasRoom
      if (onImageUpload && data.url) {
        // We need to fetch the image to get dimensions or just use a default
        const img = new Image();
        img.src = data.url;
        img.crossOrigin = "anonymous";
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          const max = 400;
          if (w > max || h > max) {
            const ratio = Math.min(max / w, max / h);
            w *= ratio;
            h *= ratio;
          }
          onImageUpload(null, { url: data.url, width: w, height: h });
        };
      }
      setIsAIModalOpen(false);
      setAiPrompt('');
    } catch (error) {
      console.error(error);
      alert('AI Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const colors = [
    '#ffffff', '#FFB6C1', '#FFC0CB', '#FF69B4', '#DA70D6', 
    '#E6E6FA', '#FFF0F5', '#FF7F50', '#FF1493'
  ];

  const sizes = [2, 5, 10, 20, 40];

  const brushes = [
    { id: 'select', icon: MousePointer2, label: 'Cupid Selector' },
    { id: 'laser', icon: Sparkles, label: 'Heart Laser' },
    { id: 'pencil', icon: Pencil, label: 'Love Pen ✍️' },
    { id: 'highlighter', icon: Highlighter, label: 'Glow Brush' },
    { id: 'neon', icon: Wand2, label: 'Magic Sparks' },
    { id: 'dotted', icon: CircleDot, label: 'Stardust' },
    { id: 'text', icon: Type, label: 'Secret Note 💌' },
    { id: 'eraser', icon: Eraser, label: 'Heart Fix 💔' },
    { id: 'pan', icon: Hand, label: 'Move Love' },
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
                className={`group relative size-11 flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-110" : "text-rose-300 hover:bg-rose-50 hover:text-rose-500"}`}
                title={b.label}
              >
                <b.icon className="size-5" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-rose-500/90 backdrop-blur-md text-[10px] font-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg shadow-rose-200">
                  {b.label}
                </span>
              </button>
            );
          })}
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative size-11 flex items-center justify-center rounded-full text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300"
            title="Memory Photo 📷"
          >
            <ImageIcon className="size-5" />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageUpload(file);
                e.target.value = ''; // Reset for same file selection
              }}
            />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-2 px-3 border-r border-white/5">
          <div className="flex gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`size-6 rounded-full border-2 transition-all duration-200 hover:scale-125 ${color === c ? 'border-white ring-2 ring-rose-500/50 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="relative group size-8 rounded-full overflow-hidden border border-white/10 hover:border-rose-500 transition-colors">
            <input 
              type="color" 
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
            />
            <PaintBucket className="absolute inset-0 m-auto size-3 text-rose-400 pointer-events-none mix-blend-difference" />
          </div>
        </div>

        {/* Brush Size Custom Dropdown */}
        <div className="relative flex items-center px-2">
           <button 
             onClick={() => setIsSizeOpen(!isSizeOpen)}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 text-rose-400 transition-all group"
           >
             <span className="text-[11px] font-black uppercase tracking-widest">{size}px</span>
             <Plus className={`size-3 transition-transform duration-300 ${isSizeOpen ? 'rotate-45' : ''}`} />
           </button>

           {isSizeOpen && (
             <>
               <div className="fixed inset-0 z-[-1]" onClick={() => setIsSizeOpen(false)} />
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-2 bg-white/90 backdrop-blur-2xl border border-rose-100 rounded-2xl flex flex-col gap-1 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 shadow-xl z-[70] min-w-[80px]">
                 {sizes.map(s => (
                   <button
                     key={s}
                     onClick={() => {
                       setSize(s);
                       setIsSizeOpen(false);
                     }}
                     className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${size === s ? 'bg-rose-500 text-white' : 'text-rose-400 hover:bg-rose-50'}`}
                   >
                     {s}px
                   </button>
                 ))}
               </div>
             </>
           )}
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-1 pl-2 border-l border-rose-100">
          <button onClick={onUndo} className="size-10 flex items-center justify-center rounded-full text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
            <Undo2 className="size-4" />
          </button>
          <button onClick={onRedo} className="size-10 flex items-center justify-center rounded-full text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
            <Redo2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Secondary Actions Dock (History, Video, Chat, etc.) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full glass-light border border-white/5 premium-shadow pointer-events-auto animate-in slide-in-from-bottom-8 duration-700 delay-100">
        
        {/* Group 1: Collaboration */}
        <div className="flex items-center gap-1 px-1 border-r border-rose-100">
          <button onClick={onToggleHistory} className={`size-9 flex items-center justify-center rounded-full transition-all ${isHistoryOpen ? "bg-rose-500/20 text-rose-500" : "text-rose-300 hover:text-rose-500"}`} title="Our Memories">
            <History className="size-4" />
          </button>
          <button onClick={onToggleCall} className={`size-9 flex items-center justify-center rounded-full transition-all ${inCall ? "bg-rose-500 text-white shadow-md shadow-rose-200" : "text-rose-300 hover:text-rose-500"}`} title="Together Now 💞">
            <Video className="size-4" />
          </button>
          <button onClick={onToggleChat} className="relative size-9 flex items-center justify-center rounded-full text-rose-300 hover:text-rose-500 transition-all" title="Secret Letters">
            <MessageSquare className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 size-4 flex items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Group 2: Canvas Tools */}
        <div className="flex items-center gap-1 px-1 border-r border-rose-100">
          <button onClick={() => setShowRopes(!showRopes)} className={`size-9 flex items-center justify-center rounded-full transition-all ${showRopes ? "text-rose-500" : "text-rose-300 hover:text-rose-500"}`} title="Heart Strings 💞">
            <Spline className={`size-4 ${showRopes ? 'animate-pulse' : ''}`} />
          </button>
          <button onClick={() => setAutoMode(!autoMode)} className={`size-9 flex items-center justify-center rounded-full transition-all ${autoMode ? "text-rose-500" : "text-rose-300 hover:text-rose-500"}`} title="Perfect Hearts">
            <Wand2 className={`size-4 ${autoMode ? 'animate-spin-slow' : ''}`} />
          </button>
          <button onClick={() => setShowGrid(!showGrid)} className={`size-9 flex items-center justify-center rounded-full transition-all ${showGrid ? "text-rose-500" : "text-rose-300 hover:text-rose-500"}`} title="Love Grid">
            <Grid3X3 className="size-4" />
          </button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`size-9 flex items-center justify-center rounded-full transition-all ${snapToGrid ? "text-rose-500" : "text-rose-300 hover:text-rose-500"}`} title="Magnetic Love">
            <Magnet className={`size-4 ${snapToGrid ? 'animate-pulse text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Group 3: Fun & Reactions */}
        <div className="flex items-center gap-1 px-1 border-r border-white/5">
          <button onClick={onToggleWatchParty} className={`size-9 flex items-center justify-center rounded-full transition-all ${isWatchPartyOpen ? "text-rose-500" : "text-rose-300 hover:text-rose-500"}`} title="Watch Party">
            <Film className="size-4" />
          </button>
          <button onClick={onOpenGames} className="size-9 flex items-center justify-center rounded-full text-rose-300 hover:text-rose-500 transition-all" title="Games">
            <Gamepad2 className="size-4" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsReactionWheelOpen(!isReactionWheelOpen)}
              className={`size-9 flex items-center justify-center rounded-full transition-all ${isReactionWheelOpen ? "bg-rose-500 text-white" : "text-rose-300 hover:text-rose-500"}`} 
              title="Send Love"
            >
              <Smile className="size-4" />
            </button>
            
            {isReactionWheelOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsReactionWheelOpen(false)} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-2 bg-white/90 backdrop-blur-2xl border border-rose-100 rounded-[2rem] flex gap-2 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 shadow-[0_15px_50px_-12px_rgba(244,63,94,0.4)] z-[70]">
                  {['❤️', '🔥', '👍', '😂', '😮', '🎉'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReaction(emoji);
                        setIsReactionWheelOpen(false);
                      }}
                      className="size-11 flex items-center justify-center rounded-2xl hover:bg-rose-50 hover:scale-125 transition-all text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Group 4: AI & Utility */}
        <div className="flex items-center gap-1 px-1">
          <div className="relative">
            <button 
              onClick={() => setIsAIModalOpen(!isAIModalOpen)}
              className={`size-9 flex items-center justify-center rounded-full transition-all ${isAIModalOpen ? "bg-rose-600 text-white shadow-lg" : "text-rose-300 hover:text-rose-500"}`} 
              title="Dream Together ✨"
            >
              <Wand2 className={`size-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>

            {isAIModalOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsAIModalOpen(false)} />
                <div className="absolute bottom-full right-0 mb-4 p-6 bg-white/90 backdrop-blur-3xl border border-rose-100 rounded-[2.5rem] flex flex-col gap-4 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.4)] z-[70] min-w-[320px]">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="size-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Sparkle className="size-4 text-purple-500" />
                    </div>
                    <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Dream Together ✨</span>
                  </div>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want to draw..."
                    className="bg-rose-50/30 border-2 border-rose-50 focus:border-rose-200 rounded-2xl p-4 text-sm text-rose-700 focus:outline-none transition-all resize-none h-28 font-bold"
                    disabled={isGenerating}
                  />
                  <button 
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-rose-400 hover:brightness-110 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-200"
                  >
                    {isGenerating ? "Dreaming..." : "Create Memory Image"}
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={onClear} className="size-9 flex items-center justify-center rounded-full text-rose-200 hover:text-rose-500 transition-all" title="Reset Memory">
            <Trash2 className="size-4" />
          </button>
          
          <button onClick={onShare} className="ml-1 size-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 text-white shadow-lg shadow-rose-200/50 hover:brightness-110 active:scale-95 transition-all" title="Share with My Love 💞">
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
