import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, MessageCircleHeart } from 'lucide-react';

const RomanticWidgets = () => {
  const [daysTogether, setDaysTogether] = useState(0);
  const [dailyNote, setDailyNote] = useState(localStorage.getItem('love-daily-note') || "I love you more today than yesterday! ❤️");
  const [isNoteEditing, setIsNoteEditing] = useState(false);
  
  // Calculate days since a start date (mocked to 1 year ago if not set)
  useEffect(() => {
    const startDate = localStorage.getItem('love-start-date') || new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    setDaysTogether(diff);
    if (!localStorage.getItem('love-start-date')) {
      localStorage.setItem('love-start-date', startDate);
    }
  }, []);

  const saveNote = (val) => {
    setDailyNote(val);
    localStorage.setItem('love-daily-note', val);
    setIsNoteEditing(false);
  };

  return (
    <div className="fixed top-24 right-6 z-40 flex flex-col gap-4 pointer-events-none w-64 transition-all duration-500">
      {/* Love Counter */}
      <div className="pointer-events-auto glass rounded-3xl p-4 shadow-lg border-white/50 animate-in slide-in-from-right-10 duration-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-8 rounded-full bg-rose-100 flex items-center justify-center">
            <Heart className="size-4 text-rose-500 fill-rose-500 animate-pulse" />
          </div>
          <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Together Forever</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-rose-600 font-serif italic">{daysTogether}</span>
          <span className="text-xs font-bold text-rose-400 uppercase">Days of Love</span>
        </div>
      </div>

      {/* Daily Love Note */}
      <div className="pointer-events-auto glass rounded-3xl p-4 shadow-lg border-white/50 animate-in slide-in-from-right-10 duration-700 delay-150">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-pink-100 flex items-center justify-center">
              <MessageCircleHeart className="size-4 text-pink-500" />
            </div>
            <span className="text-xs font-black text-pink-600 uppercase tracking-widest">Daily Note</span>
          </div>
          <button 
            onClick={() => setIsNoteEditing(!isNoteEditing)}
            className="text-[10px] font-black text-pink-400 uppercase hover:text-pink-600 transition-colors"
          >
            {isNoteEditing ? 'Done' : 'Edit'}
          </button>
        </div>
        {isNoteEditing ? (
          <textarea
            autoFocus
            className="w-full bg-white/30 border border-pink-200 rounded-xl p-2 text-sm text-rose-700 focus:outline-none focus:ring-2 ring-pink-300 resize-none h-20"
            value={dailyNote}
            onChange={(e) => setDailyNote(e.target.value)}
            onBlur={() => saveNote(dailyNote)}
          />
        ) : (
          <p className="text-sm font-bold text-rose-700 italic leading-relaxed font-serif">
            "{dailyNote}"
          </p>
        )}
      </div>

      {/* Milestones / Memories */}
      <div className="pointer-events-auto glass rounded-3xl p-4 shadow-lg border-white/50 animate-in slide-in-from-right-10 duration-700 delay-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Sparkles className="size-4 text-amber-500" />
          </div>
          <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Our Story</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-1.5 rounded-full bg-rose-400" />
            <span className="text-[11px] font-bold text-rose-600">First Collaboration</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-1.5 rounded-full bg-rose-200" />
            <span className="text-[11px] font-bold text-rose-400">100 Memories Created</span>
          </div>
          <div className="flex items-center gap-3 opacity-50">
            <div className="size-1.5 rounded-full bg-slate-200" />
            <span className="text-[11px] font-bold text-slate-400 italic">Next Milestone soon...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RomanticWidgets;
