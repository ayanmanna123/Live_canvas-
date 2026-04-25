import React, { useState } from 'react';
import { Camera, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CaptureModal = ({ isOpen, onClose, onCapture, imagePreview }) => {
  const [caption, setCaption] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onCapture(caption);
    setIsSaving(false);
    setCaption('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-white/60 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.5)]"
        >
          <div className="p-6 flex items-center justify-between bg-gradient-to-r from-rose-400 to-pink-500 text-white">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5" />
              <span className="text-sm font-black uppercase tracking-widest">Preserve this Moment</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="aspect-video rounded-2xl overflow-hidden border-4 border-rose-50 shadow-inner bg-rose-50/50">
              {imagePreview ? (
                <img src={imagePreview} alt="Snapshot" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <Camera className="h-8 w-8 text-rose-200" />
                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Generating Preview...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] ml-1">Caption your memory</label>
              <textarea
                autoFocus
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What was happening in this moment?"
                className="w-full bg-rose-50/30 border-2 border-rose-50 focus:border-rose-200 rounded-2xl p-4 text-sm text-rose-700 focus:outline-none transition-all resize-none h-24 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 hover:brightness-110 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-rose-200"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving to Vault...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Lock into Memory Vault
                </>
              )}
            </button>
            
            <p className="text-center text-[10px] font-bold text-rose-300 uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="h-3 w-3" />
              This moment will be preserved forever
              <Sparkles className="h-3 w-3" />
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CaptureModal;
