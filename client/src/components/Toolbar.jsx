import React, { useState } from 'react';
import { Pencil, Eraser, Trash2, Share2, MessageSquare, Highlighter, Sparkles, Type, Undo2, Redo2, Hand, CircleDot, PaintBucket, Spline, History, Video, Wand2, Film, Gamepad2, MousePointer2, Image as ImageIcon, Grid3X3, Target, Shapes, Magnet, Smile, Sparkle } from 'lucide-react';
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
    '#ffffff', '#6750A4', '#1C1B1F', '#ef4444', '#f97316', 
    '#10b981', '#06b6d4', '#3b82f6', '#d946ef'
  ];

  const sizes = [2, 5, 10, 20, 40];

  const brushes = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'laser', icon: Target, label: 'Laser' },
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
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative size-11 flex items-center justify-center rounded-full text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300"
            title="Upload Image"
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
      <div className="flex items-center gap-1.5 p-1.5 rounded-full glass-light border border-white/5 premium-shadow pointer-events-auto animate-in slide-in-from-bottom-8 duration-700 delay-100">
        
        {/* Group 1: Collaboration */}
        <div className="flex items-center gap-1 px-1 border-r border-white/5">
          <button onClick={onToggleHistory} className={`size-9 flex items-center justify-center rounded-full transition-all ${isHistoryOpen ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Activity History">
            <History className="size-4" />
          </button>
          <button onClick={onToggleCall} className={`size-9 flex items-center justify-center rounded-full transition-all ${inCall ? "bg-red-500/20 text-red-400" : "text-slate-400 hover:text-white"}`} title="Video Call">
            <Video className="size-4" />
          </button>
          <button onClick={onToggleChat} className="relative size-9 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-all" title="Chat">
            <MessageSquare className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 size-4 flex items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white ring-2 ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Group 2: Canvas Tools */}
        <div className="flex items-center gap-1 px-1 border-r border-white/5">
          <button onClick={() => setShowRopes(!showRopes)} className={`size-9 flex items-center justify-center rounded-full transition-all ${showRopes ? "text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Toggle Ropes">
            <Spline className="size-4" />
          </button>
          <button onClick={() => setAutoMode(!autoMode)} className={`size-9 flex items-center justify-center rounded-full transition-all ${autoMode ? "text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Auto Shape">
            <Shapes className={`size-4 ${autoMode ? 'animate-pulse' : ''}`} />
          </button>
          <button onClick={() => setShowGrid(!showGrid)} className={`size-9 flex items-center justify-center rounded-full transition-all ${showGrid ? "text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Toggle Grid">
            <Grid3X3 className="size-4" />
          </button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`size-9 flex items-center justify-center rounded-full transition-all ${snapToGrid ? "text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Snap to Grid">
            <Magnet className={`size-4 ${snapToGrid ? 'animate-pulse text-indigo-400' : ''}`} />
          </button>
        </div>

        {/* Group 3: Fun & Reactions */}
        <div className="flex items-center gap-1 px-1 border-r border-white/5">
          <button onClick={onToggleWatchParty} className={`size-9 flex items-center justify-center rounded-full transition-all ${isWatchPartyOpen ? "text-indigo-400" : "text-slate-400 hover:text-white"}`} title="Watch Party">
            <Film className="size-4" />
          </button>
          <button onClick={onOpenGames} className="size-9 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-all" title="Games">
            <Gamepad2 className="size-4" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsReactionWheelOpen(!isReactionWheelOpen)}
              className={`size-9 flex items-center justify-center rounded-full transition-all ${isReactionWheelOpen ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"}`} 
              title="React"
            >
              <Smile className="size-4" />
            </button>
            
            {isReactionWheelOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsReactionWheelOpen(false)} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl flex gap-2 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 shadow-2xl z-[70]">
                  {['❤️', '🔥', '👍', '😂', '😮', '🎉'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReaction(emoji);
                        setIsReactionWheelOpen(false);
                      }}
                      className="size-10 flex items-center justify-center rounded-xl hover:bg-white/10 hover:scale-125 transition-all text-xl"
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
              className={`size-9 flex items-center justify-center rounded-full transition-all ${isAIModalOpen ? "bg-purple-600 text-white" : "text-slate-400 hover:text-purple-400"}`} 
              title="AI Image Generator"
            >
              <Wand2 className={`size-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>

            {isAIModalOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsAIModalOpen(false)} />
                <div className="absolute bottom-full right-0 mb-4 p-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 shadow-2xl z-[70] min-w-[300px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkle className="size-4 text-purple-400" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">AI Image Gen</span>
                  </div>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want to draw..."
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 ring-purple-500/50 resize-none h-24"
                    disabled={isGenerating}
                  />
                  <button 
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    {isGenerating ? "Generating..." : "Generate Image"}
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={onClear} className="size-9 flex items-center justify-center rounded-full text-slate-400 hover:text-red-400 transition-all" title="Clear All">
            <Trash2 className="size-4" />
          </button>
          
          <button onClick={onShare} className="ml-1 size-9 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:brightness-110 active:scale-95 transition-all" title="Share">
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
