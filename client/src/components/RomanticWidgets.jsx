import React, { useState, useEffect } from 'react';
import { MessageCircleHeart } from 'lucide-react';

const RomanticWidgets = () => {
  const [dailyNote, setDailyNote] = useState(localStorage.getItem('love-daily-note') || "Our connection grows deeper with every shared reflection. ✨");
  const [isNoteEditing, setIsNoteEditing] = useState(false);
  
  const saveNote = (val) => {
    setDailyNote(val);
    localStorage.setItem('love-daily-note', val);
    setIsNoteEditing(false);
  };

  return (
    <div className="fixed top-24 right-6 z-40 flex flex-col gap-4 pointer-events-none w-64 transition-all duration-500">
      {/* Daily Love Reflection */}
      <div className="pointer-events-auto glass rounded-3xl p-4 shadow-lg border-white/50 animate-in slide-in-from-right-10 duration-700 delay-150">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-pink-100 flex items-center justify-center">
              <MessageCircleHeart className="size-4 text-pink-500" />
            </div>
            <span className="text-xs font-black text-pink-600 uppercase tracking-widest">Daily Reflection</span>
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
    </div>
  );
};

export default RomanticWidgets;
