import React, { useState, useEffect } from 'react';
import { Gift, Lock, Timer, Heart, Eye, Trash2, X, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GiftBox = ({ gift, onOpen, onDelete, isSender }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(gift.unlockDate) - new Date();
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
    if (gift.isOpened) {
      setShowPreview(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ left: gift.position.x, top: gift.position.y }}
        className="absolute z-10 cursor-pointer group"
        onClick={handleOpenClick}
      >
        <div className="relative">
          {/* Pulse Effect for Unlocked Gifts */}
          {isUnlocked && !gift.isOpened && (
            <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-20" />
          )}

          <div className={`p-4 rounded-3xl shadow-lg transition-all duration-300 flex flex-col items-center gap-2 ${
            gift.isOpened 
              ? 'bg-white/90 backdrop-blur-md border-2 border-rose-100' 
              : isUnlocked 
                ? 'bg-gradient-to-br from-rose-400 to-pink-500 scale-110 shadow-rose-200' 
                : 'bg-white/80 backdrop-blur-sm border-2 border-dashed border-rose-200'
          }`}>
            {gift.isOpened ? (
              <div className="relative">
                <Gift className="size-8 text-rose-500" />
                <div className="absolute -top-1 -right-1 size-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
            ) : isUnlocked ? (
              <Gift className="size-10 text-white animate-bounce" />
            ) : (
              <Lock className="size-8 text-rose-300" />
            )}

            {!gift.isOpened && !isUnlocked && timeLeft && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Unlocking</span>
                <div className="flex gap-1 text-[10px] font-bold text-rose-500">
                  {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
                  <span>{timeLeft.hours}h</span>
                  <span>{timeLeft.minutes}m</span>
                </div>
              </div>
            )}

            {isUnlocked && !gift.isOpened && (
              <span className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Ready to Open!</span>
            )}
            
            {gift.isOpened && (
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Opened Capsule</span>
            )}
          </div>
          
          {/* Action Tooltip */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] font-bold py-1.5 px-3 rounded-full whitespace-nowrap z-20">
            {gift.isOpened ? 'View Memories' : isUnlocked ? 'Click to Open Surprise!' : `Unlocks ${new Date(gift.unlockDate).toLocaleDateString()}`}
          </div>
        </div>
      </motion.div>

      {/* Reveal Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-rose-950/40 backdrop-blur-md"
              onClick={() => setShowPreview(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_30px_90px_-20px_rgba(244,63,94,0.4)] overflow-hidden border border-rose-100"
            >
              <div className="p-10 flex flex-col items-center text-center gap-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-16 rounded-3xl bg-rose-50 flex items-center justify-center">
                    <Gift className="size-10 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-rose-900 uppercase tracking-tight">Opened Capsule</h2>
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">A memory from {gift.senderName}</p>
                  </div>
                </div>

                {/* Combined Content Display */}
                <div className="w-full space-y-6">
                  {/* Image Display */}
                  {(gift.content.imageUrl || gift.content.drawingUrl) && (
                    <div className="relative group/content max-w-full">
                       <img 
                         src={gift.content.imageUrl || gift.content.drawingUrl} 
                         alt="Time Capsule Memory" 
                         className="max-h-[350px] w-auto mx-auto rounded-3xl shadow-xl border-8 border-rose-50"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent rounded-3xl pointer-events-none" />
                       <div className="mt-4 flex items-center justify-center gap-2 text-rose-500 font-bold bg-rose-50/50 w-fit mx-auto px-4 py-1.5 rounded-full border border-rose-100 text-[10px] uppercase tracking-widest">
                         <ImageIcon className="size-3" />
                         Captured Moment
                       </div>
                    </div>
                  )}

                  {/* Message Display */}
                  {gift.content.message && (
                    <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/50 p-8 rounded-[2rem] border-2 border-rose-50 relative">
                       <MessageSquare className="absolute -top-3 -left-3 size-10 text-rose-200/50 rotate-[-12deg]" />
                       <p className="text-xl text-rose-800 font-serif leading-relaxed italic relative z-10">
                         "{gift.content.message}"
                       </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 w-full">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex-1 py-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-200"
                  >
                    Close & Keep Memory
                  </button>
                  {isSender && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this capsule?')) {
                          onDelete(gift._id);
                          setShowPreview(false);
                        }
                      }}
                      className="p-5 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-2xl transition-all"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => setShowPreview(false)}
                className="absolute top-6 right-6 size-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-100 transition-colors"
              >
                <X className="size-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GiftBox;
