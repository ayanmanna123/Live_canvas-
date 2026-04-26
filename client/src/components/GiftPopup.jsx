import React, { useState, useRef, useEffect } from 'react';
import { Gift, Calendar, Heart, X, Send, MessageSquare, Image as ImageIcon, Upload, CheckCircle2, History, Lock, Eye, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const GiftPopup = ({ isOpen, onClose, onSend, userName, gifts = [], onOpenGift, onDeleteGift, socketId }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'history'
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [viewingGift, setViewingGift] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large! Please select an image under 5MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
      let imageUrl = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      await onSend({
        contentType: 'capsule',
        content: {
          message: message.trim() || null,
          imageUrl: imageUrl
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
    setSelectedFile(null);
    setFilePreview(null);
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
                    Add a Photo
                  </label>
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className={`relative aspect-video rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 overflow-hidden ${filePreview ? 'border-rose-200 bg-rose-50' : 'border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-200'}`}
                  >
                    {filePreview ? (
                      <>
                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
                            <Upload className="size-4" />
                            Change Picture
                          </div>
                        </div>
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                          <CheckCircle2 className="size-4" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="size-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500">
                          <Upload className="size-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-rose-600">Choose a Picture</p>
                          <p className="text-[10px] text-rose-400 font-medium">Capture a moment to lock away</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
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
                  sortedGifts.map((gift) => {
                    const isUnlocked = new Date(gift.unlockDate) <= new Date();
                    const isOwnGift = gift.senderId === socketId;

                    return (
                      <motion.div
                        key={gift._id}
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
                                 onClick={() => onOpenGift(gift._id)}
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

      {/* Gift Detail View (Nested Modal) */}
      <AnimatePresence>
        {viewingGift && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-rose-950/60 backdrop-blur-md"
              onClick={() => setViewingGift(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-rose-100"
            >
              <div className="p-10 flex flex-col items-center text-center gap-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500">
                    <Gift className="size-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-rose-900 uppercase tracking-tight">Opened Capsule</h2>
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">A memory from {viewingGift.senderName}</p>
                  </div>
                </div>

                <div className="w-full space-y-6">
                  {(viewingGift.content.imageUrl || viewingGift.content.drawingUrl) && (
                    <div className="relative group max-w-full">
                       <img 
                         src={viewingGift.content.imageUrl || viewingGift.content.drawingUrl} 
                         alt="Memory" 
                         className="max-h-[350px] w-auto mx-auto rounded-3xl shadow-xl border-8 border-rose-50"
                       />
                    </div>
                  )}

                  {viewingGift.content.message && (
                    <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/50 p-8 rounded-[2rem] border-2 border-rose-50 relative">
                       <MessageSquare className="absolute -top-3 -left-3 size-10 text-rose-200/50 rotate-[-12deg]" />
                       <p className="text-xl text-rose-800 font-serif leading-relaxed italic relative z-10">
                         "{viewingGift.content.message}"
                       </p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setViewingGift(null)}
                  className="w-full py-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Close & Back to Capsules
                </button>
              </div>
              <button 
                onClick={() => setViewingGift(null)}
                className="absolute top-6 right-6 size-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-100"
              >
                <X className="size-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default GiftPopup;
