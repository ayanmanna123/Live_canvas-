import React, { useState, useRef, useEffect } from 'react';
import { Gift, Calendar, Heart, X, Send, MessageSquare, Image as ImageIcon, Upload, CheckCircle2, History, Lock, Eye, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GiftRevealModal from './GiftRevealModal';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const GiftPopup = ({ isOpen, onClose, onSend, userName, gifts = [], onOpenGift, onDeleteGift, socketId }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'history'
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [replacingIndex, setReplacingIndex] = useState(null);
  const [viewingGift, setViewingGift] = useState(null);
  const [openingGiftId, setOpeningGiftId] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-view gift when it transitions to opened state if we were the ones opening it
  useEffect(() => {
    if (openingGiftId) {
      const openedGift = gifts.find(g => g._id === openingGiftId && g.isOpened);
      if (openedGift) {
        setViewingGift(openedGift);
        setOpeningGiftId(null);
      }
    }
  }, [gifts, openingGiftId]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      setReplacingIndex(null);
      return;
    }

    // Replacement Logic
    if (replacingIndex !== null) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large! Please select an image under 5MB.');
        setReplacingIndex(null);
        return;
      }

      const newFiles = [...selectedFiles];
      newFiles[replacingIndex] = file;
      setSelectedFiles(newFiles);

      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...filePreviews];
        newPreviews[replacingIndex] = reader.result;
        setFilePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
      
      setReplacingIndex(null);
      e.target.value = '';
      return;
    }

    // Multi-Add Logic
    if (selectedFiles.length + files.length > 5) {
      alert('You can only upload up to 5 pictures per gift.');
      return;
    }

    const newFiles = [...selectedFiles];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large! Please select images under 5MB.`);
        return;
      }
      newFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setSelectedFiles(newFiles);
    // Reset input value so the same file can be selected again if removed
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unlockDate) {
      alert('Please select an unlock date!');
      return;
    }
    
    if (!message.trim() && !selectedFile) {
      alert('Please add a message or upload a picture (or both)!');
      return;
    }

    setIsSending(true);
    
    try {
      const imageUrls = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('image', file);
          
          const uploadRes = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (!uploadRes.ok) throw new Error('Upload failed');
          const uploadData = await uploadRes.json();
          imageUrls.push(uploadData.url);
        }
      }

      await onSend({
        contentType: 'capsule',
        content: {
          message: message.trim() || null,
          imageUrl: imageUrls[0] || null, // For backward compatibility
          imageUrls: imageUrls
        },
        unlockDate: new Date(unlockDate),
      });

      setActiveTab('history');
      resetForm();
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Failed to send gift. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setMessage('');
    setUnlockDate('');
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  const sortedGifts = [...gifts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-rose-900/20 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(244,63,94,0.3)] overflow-hidden border border-rose-100 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-400 to-pink-500 p-6 text-white flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Gift className="size-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight">Time Capsule</h3>
                  <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest">Our Shared Journey</p>
                </div>
              </div>
              <button onClick={onClose} className="size-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <X className="size-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-6 bg-black/10 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-white text-rose-500 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >
                <Plus className="size-3" />
                Create New
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-rose-500 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >
                <History className="size-3" />
                Our Capsules ({gifts.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {activeTab === 'create' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Picture Upload Area */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    <ImageIcon className="size-3" />
                    Captured Moments ({selectedFiles.length}/5)
                  </label>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {filePreviews.map((preview, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-2xl overflow-hidden border-2 border-rose-100 group cursor-pointer"
                        onClick={() => {
                          // Setting a temp state to know which index to replace
                          setReplacingIndex(index);
                          fileInputRef.current.click();
                        }}
                      >
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="size-4 text-white mb-1" />
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">Replace</span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="absolute top-1 right-1 size-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                        >
                          <X className="size-3" />
                        </button>
                      </motion.div>
                    ))}
                    
                    {selectedFiles.length < 5 && (
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-rose-400"
                      >
                        <Plus className="size-5" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Add Photo</span>
                      </div>
                    )}
                  </div>
                  
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />
                </div>

                {/* Message Area */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    <MessageSquare className="size-3" />
                    Add a Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a heartfelt letter to be read in the future..."
                    className="w-full h-32 p-5 bg-rose-50/50 border-2 border-rose-50 focus:border-rose-200 rounded-[2rem] text-rose-800 placeholder:text-rose-300 focus:outline-none transition-all resize-none font-medium text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    <Calendar className="size-3" />
                    Unlock Date & Time
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-rose-400" />
                    <input
                      type="datetime-local"
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-rose-50/50 border-2 border-rose-50 focus:border-rose-200 rounded-full text-rose-800 focus:outline-none transition-all font-bold text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 disabled:opacity-50 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-rose-200"
                >
                  {isSending ? "Sealing Capsule..." : "Seal & Send to Future"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {sortedGifts.length === 0 ? (
                  <div className="py-20 flex flex-col items-center text-center gap-4 opacity-40">
                    <div className="size-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                      <History className="size-8" />
                    </div>
                    <p className="text-sm font-bold text-rose-900 uppercase tracking-widest">No capsules yet</p>
                  </div>
                ) : (
                  sortedGifts.map((gift, index) => {
                    const isUnlocked = new Date(gift.unlockDate) <= new Date();
                    const isOwnGift = gift.senderId === socketId;

                    return (
                      <motion.div
                        key={gift._id && gift._id !== '' ? gift._id : `gift-temp-${gift.createdAt || 'no-date'}-${index}`}
                        layout
                        className={`p-5 rounded-3xl border-2 transition-all ${gift.isOpened ? 'bg-rose-50/30 border-rose-100' : 'bg-white border-rose-50 shadow-sm'}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`size-12 rounded-2xl flex items-center justify-center ${gift.isOpened ? 'bg-rose-100 text-rose-500' : isUnlocked ? 'bg-emerald-100 text-emerald-500 animate-pulse' : 'bg-rose-50 text-rose-300'}`}>
                              {gift.isOpened ? <Eye className="size-6" /> : isUnlocked ? <Gift className="size-6" /> : <Lock className="size-5" />}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                                {isOwnGift ? 'Sent by you' : `From ${gift.senderName}`}
                              </p>
                              <p className="text-sm font-bold text-rose-900">
                                {gift.isOpened ? 'Unlocked Memory' : isUnlocked ? 'Ready to Open!' : `Unlocks ${new Date(gift.unlockDate).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {isUnlocked && !gift.isOpened && !isOwnGift && (
                               <button 
                                 onClick={() => {
                                   setOpeningGiftId(gift._id);
                                   onOpenGift(gift._id);
                                 }}
                                 className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all"
                               >
                                 Open
                               </button>
                             )}
                             {gift.isOpened && (
                               <button 
                                 onClick={() => setViewingGift(gift)}
                                 className="p-2 bg-rose-100 text-rose-500 rounded-xl hover:bg-rose-200 transition-all"
                               >
                                 <Eye className="size-4" />
                               </button>
                             )}
                             {isOwnGift && (
                               <button 
                                 onClick={() => {
                                   if (window.confirm('Delete this capsule?')) onDeleteGift(gift._id);
                                 }}
                                 className="p-2 bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                               >
                                 <Trash2 className="size-4" />
                               </button>
                             )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="bg-rose-50 p-5 text-center flex-shrink-0">
            <p className="text-[10px] font-bold text-rose-400 flex items-center justify-center gap-1.5 uppercase tracking-tighter">
              Made with <Heart className="size-3 fill-rose-400" /> for {userName}
            </p>
          </div>
        </motion.div>
      </div>

      <GiftRevealModal 
        gift={viewingGift}
        isOpen={!!viewingGift}
        onClose={() => setViewingGift(null)}
        userName={userName}
      />
    </AnimatePresence>
  );
};

export default GiftPopup;
