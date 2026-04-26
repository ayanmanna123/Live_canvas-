import React, { useState, useEffect } from 'react';
import { Camera, X, Trash2, Calendar, User, Heart, MessageSquare, Download, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MemoryVault = ({ isOpen, onClose, roomId }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null); // { url, caption }

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen, roomId]);

  const [activeTab, setActiveTab] = useState('capture'); // 'capture' or 'gift'

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/memories/${roomId}`);
      if (!response.ok) throw new Error('Failed to fetch memories');
      const data = await response.json();
      setMemories(data);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMemories = memories.filter(m => m.type === activeTab || (!m.type && activeTab === 'capture'));

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this memory? It will be gone forever! 💔')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/memories/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setMemories(prev => prev.filter(m => m._id !== id));
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'captured-moment.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] overflow-hidden border border-white/60 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.3)] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between bg-gradient-to-r from-rose-400 to-pink-500 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest">Memory Vault</h2>
                <p className="text-[10px] font-bold text-rose-100 uppercase opacity-80">Our shared journey, captured in moments</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Section Selector */}
          <div className="flex px-8 pt-6 pb-2 gap-4 border-b border-rose-50 bg-white/50">
            <button
              onClick={() => setActiveTab('capture')}
              className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'capture' ? 'border-rose-500 text-rose-600' : 'border-transparent text-rose-300 hover:text-rose-400'}`}
            >
              <Camera className="size-4" />
              Captured Moments
            </button>
            <button
              onClick={() => setActiveTab('gift')}
              className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'gift' ? 'border-rose-500 text-rose-600' : 'border-transparent text-rose-300 hover:text-rose-400'}`}
            >
              <MessageSquare className="size-4" />
              Time Capsules
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <div className="size-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                <p className="text-rose-400 font-bold uppercase tracking-widest text-xs">Opening Vault...</p>
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center gap-4">
                <div className="p-6 rounded-full bg-rose-50 border border-rose-100">
                  {activeTab === 'capture' ? <Camera className="h-12 w-12 text-rose-200" /> : <MessageSquare className="h-12 w-12 text-rose-200" />}
                </div>
                <div>
                  <p className="text-rose-900 font-black uppercase tracking-widest">No {activeTab === 'capture' ? 'moments' : 'gifts'} yet</p>
                  <p className="text-rose-400 text-sm font-medium">{activeTab === 'capture' ? 'Capture your first moment from the toolbar!' : 'Open a Time Capsule to save it here!'}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredMemories.map((memory) => (
                  <motion.div
                    key={memory._id}
                    layout
                    className="group bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-rose-100 transition-all duration-500">
                                     <div className="aspect-video relative overflow-hidden bg-rose-50/30">
                      {memory.contentType === 'message' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-rose-50 to-pink-50 text-center relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-10">
                              <MessageSquare className="size-24 rotate-12" />
                           </div>
                           <Heart className="size-8 text-rose-300 mb-4 fill-rose-100" />
                           <p className="text-rose-800 font-serif italic text-lg leading-relaxed line-clamp-4 relative z-10">
                             "{memory.caption}"
                           </p>
                           <div className="mt-4 flex items-center gap-2 text-rose-400 font-bold text-[10px] uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-rose-100">
                             <Mail className="size-3" />
                             Secret Letter
                           </div>
                        </div>
                      ) : (
                        <img
                          src={memory.imageUrl}
                          alt={memory.caption}
                          onClick={() => setPreviewImage({ url: memory.imageUrl, caption: memory.caption })}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                         <div className="flex items-center gap-3 text-white">
                           <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-[10px] font-bold">
                             <Calendar className="h-3 w-3" />
                             {new Date(memory.createdAt).toLocaleDateString()}
                           </div>
                           <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-[10px] font-bold">
                             <User className="h-3 w-3" />
                             {memory.createdBy}
                           </div>
                         </div>
                      </div>
                       <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                         {memory.contentType !== 'message' && (
                           <button
                             onClick={() => setPreviewImage({ url: memory.imageUrl, caption: memory.caption })}
                             className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-500 hover:scale-110 transition-all"
                             title="Preview Moment"
                           >
                             <Eye className="size-4" />
                           </button>
                         )}
                         {memory.contentType !== 'message' && (
                           <button
                             onClick={() => handleDownload(memory.imageUrl, `moment-${new Date(memory.createdAt).getTime()}.png`)}
                             className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-emerald-500 hover:scale-110 transition-all"
                             title="Download Image"
                           >
                             <Download className="size-4" />
                           </button>
                         )}
                         <button
                           onClick={() => handleDelete(memory._id)}
                           className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-600 hover:scale-110 transition-all"
                           title="Delete Memory"
                         >
                           <Trash2 className="size-4" />
                         </button>
                       </div>
                    </div>
                    <div className="p-5">
                      {memory.contentType === 'message' ? (
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">From {memory.createdBy}</p>
                           <p className="text-[10px] font-bold text-rose-300 italic">{new Date(memory.createdAt).toLocaleDateString()}</p>
                        </div>
                      ) : memory.caption ? (
                        <div className="flex gap-3">
                          <MessageSquare className="h-4 w-4 text-rose-300 mt-1 flex-shrink-0" />
                          <p className="text-rose-900 font-bold italic leading-relaxed">
                            "{memory.caption}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-rose-300 text-xs italic">No caption added...</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-rose-50/50 border-t border-rose-100 flex justify-center">
            <div className="flex items-center gap-2 text-rose-400">
               <Heart className="h-4 w-4 fill-rose-400" />
               <span className="text-xs font-black uppercase tracking-widest">Keep making memories</span>
               <Heart className="h-4 w-4 fill-rose-400" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Full Screen Preview Overlay */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="size-8" />
                </button>
              </div>

              <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                <img
                  src={previewImage.url}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-rose-500/20"
                />
              </div>

              <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex items-center justify-between gap-6">
                <div className="flex-1">
                  <p className="text-white text-lg font-bold italic">"{previewImage.caption || "A beautiful moment..."}"</p>
                </div>
                <button
                  onClick={() => handleDownload(previewImage.url)}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/30"
                >
                  <Download className="size-5" />
                  Download This Moment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default MemoryVault;
