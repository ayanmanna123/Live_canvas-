import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Coffee, Heart, Moon, Zap, Ghost } from 'lucide-react';

const VIBES = [
  { id: 'happy', emoji: '😊', label: 'Feeling Happy', color: 'bg-yellow-400', aura: 'rgba(250, 204, 21, 0.4)' },
  { id: 'cuddly', emoji: '🥰', label: 'Feeling Cuddly', color: 'bg-rose-400', aura: 'rgba(251, 113, 133, 0.4)' },
  { id: 'busy', emoji: '💻', label: 'In the Zone', color: 'bg-blue-400', aura: 'rgba(96, 165, 250, 0.4)' },
  { id: 'missyou', emoji: '🥺', label: 'Miss You', color: 'bg-purple-400', aura: 'rgba(192, 132, 252, 0.4)' },
  { id: 'sleepy', emoji: '😴', label: 'Sleepy...', color: 'bg-indigo-400', aura: 'rgba(129, 140, 248, 0.4)' },
  { id: 'excited', emoji: '✨', label: 'Excited!', color: 'bg-orange-400', aura: 'rgba(251, 146, 60, 0.4)' },
];

const VibeTracker = ({ currentVibe, onVibeChange }) => {
  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-rose-100 shadow-2xl shadow-rose-200/50">
      <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">Set Your Vibe</span>
      <div className="flex items-center gap-2">
        {VIBES.map((v) => (
          <button
            key={v.id}
            onClick={() => onVibeChange(v.id)}
            className={`group relative size-9 flex items-center justify-center rounded-full transition-all duration-300 ${
              currentVibe === v.id 
                ? `${v.color} text-white scale-110 shadow-lg` 
                : 'bg-rose-50 text-rose-300 hover:bg-rose-100 hover:text-rose-500'
            }`}
          >
            <span className="text-sm">{v.emoji}</span>
            
            {/* Tooltip */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-[10px] font-bold text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {v.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VibeTracker;
export { VIBES };
