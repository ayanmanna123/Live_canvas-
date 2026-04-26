import { motion, AnimatePresence } from 'framer-motion';
import Stack from './Stack';
import React from 'react';
import { Gift, X, Image as ImageIcon, MessageSquare, Heart } from 'lucide-react';

const GiftRevealModal = ({ gift, isOpen, onClose, userName }) => {
  if (!isOpen || !gift) return null;

  // Prepare images for the Stack component
  const allImages = React.useMemo(() => {
    const images = gift.content.imageUrls && gift.content.imageUrls.length > 0 
      ? gift.content.imageUrls 
      : gift.content.imageUrl || gift.content.drawingUrl 
        ? [gift.content.imageUrl || gift.content.drawingUrl] 
        : [];
    // Filter out any empty strings to avoid key issues
    return images.filter(url => url && url.trim() !== '');
  }, [gift.content]);

  // Memoize the cards as elements
  const cards = React.useMemo(() => {
    return allImages.map((src, i) => (
      <img 
        key={`img-${i}`} 
        src={src} 
        alt={`card-${i + 1}`} 
        className="w-full h-full object-cover rounded-3xl pointer-events-none" 
      />
    ));
  }, [allImages]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-rose-950/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_30px_90px_-20px_rgba(244,63,94,0.4)] overflow-hidden border border-rose-100"
        >
          <div className="p-10 flex flex-col items-center text-center gap-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex flex-col items-center gap-3">
              <div className="size-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500">
                <Gift className="size-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-rose-900 uppercase tracking-tight">Opened Capsule</h2>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest text-center">A memory from {gift.senderName}</p>
              </div>
            </div>

            <div className="w-full space-y-6">
              {allImages.length > 0 && (
                <div className="w-full space-y-6 flex flex-col items-center">
                  <div className="relative size-[320px] sm:size-[400px]">
                    <Stack
                      randomRotation={true}
                      sensitivity={80}
                      sendToBackOnClick={true}
                      cards={cards}
                    />
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-rose-500 font-bold bg-rose-50/50 w-fit mx-auto px-4 py-1.5 rounded-full border border-rose-100 text-[10px] uppercase tracking-widest">
                    <ImageIcon className="size-3" />
                    {allImages.length > 1 ? `Swipe to see ${allImages.length} moments` : 'Captured Moment'}
                  </div>
                </div>
              )}

              {gift.content.message && (
                <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/50 p-8 rounded-[2rem] border-2 border-rose-50 relative w-full">
                   <MessageSquare className="absolute -top-3 -left-3 size-10 text-rose-200/50 rotate-[-12deg]" />
                   <p className="text-xl text-rose-800 font-serif leading-relaxed italic relative z-10 text-center">
                     "{gift.content.message}"
                   </p>
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-200"
            >
              Close Memory
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 size-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-100 transition-colors"
          >
            <X className="size-5" />
          </button>

          <div className="bg-rose-50 p-4 text-center border-t border-rose-100">
             <p className="text-[10px] font-bold text-rose-300 flex items-center justify-center gap-1.5 uppercase tracking-tighter">
               Stored in your shared history <Heart className="size-3 fill-rose-300" />
             </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GiftRevealModal;
