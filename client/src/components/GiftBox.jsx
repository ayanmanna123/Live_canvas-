import React, { useState, useEffect } from 'react';
import { Gift, Lock, Timer, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const GiftBox = ({ gift, onOpen, isSender }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const unlockTime = new Date(gift.unlockDate);
      const difference = unlockTime - now;

      // Visibility logic: Show if we are within 1 minute of unlocking
      const oneMinuteInMs = 60 * 1000;
      if (difference <= oneMinuteInMs) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      if (difference <= 0) {
        setIsUnlocked(true);
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [gift.unlockDate]);

  const handleOpenClick = () => {
    if (isUnlocked && !gift.isOpened) {
      onOpen(gift._id);
    }
  };

  if (!isVisible || gift.isOpened) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{ left: gift.position.x, top: gift.position.y }}
      className="absolute z-10 cursor-pointer group"
      onClick={handleOpenClick}
    >
      <div className="relative">
        {/* Pulse Effect for Unlocked Gifts */}
        {isUnlocked && (
          <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-20" />
        )}

        <div className={`p-4 rounded-3xl shadow-lg transition-all duration-300 flex flex-col items-center gap-2 ${
          isUnlocked 
            ? 'bg-gradient-to-br from-rose-400 to-pink-500 scale-110 shadow-rose-200' 
            : 'bg-white/80 backdrop-blur-sm border-2 border-dashed border-rose-200'
        }`}>
          {isUnlocked ? (
            <Gift className="size-10 text-white animate-bounce" />
          ) : (
            <Lock className="size-8 text-rose-300" />
          )}

          {!isUnlocked && timeLeft && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Unlocking</span>
              <div className="flex gap-1 text-[10px] font-bold text-rose-500">
                {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
                {timeLeft.hours > 0 && <span>{timeLeft.hours}h</span>}
                <span>{timeLeft.minutes}m</span>
                <span>{timeLeft.seconds}s</span>
              </div>
            </div>
          )}

          {isUnlocked && (
            <span className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Ready to Open!</span>
          )}
        </div>
        
        {/* Action Tooltip */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] font-bold py-1.5 px-3 rounded-full whitespace-nowrap z-20">
          {isUnlocked ? 'Click to Open Surprise!' : `Unlocks ${new Date(gift.unlockDate).toLocaleDateString()}`}
        </div>
      </div>
    </motion.div>
  );
};

export default GiftBox;
