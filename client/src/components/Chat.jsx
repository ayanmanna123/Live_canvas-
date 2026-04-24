import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Heart } from 'lucide-react';

const Chat = ({ socket, roomId, userName, isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat-history', (history) => {
      setMessages(history);
    });

    socket.on('receive-message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off('chat-history');
      socket.off('receive-message');
    };
  }, [socket, isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const messageData = {
      roomId,
      userName,
      text: message.trim(),
      userId: socket.id,
      createdAt: new Date()
    };

    socket.emit('send-message', messageData);
    setMessages((prev) => [...prev, messageData]);
    setMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 sm:inset-auto sm:top-24 sm:right-6 z-[60] sm:z-40 w-full sm:w-80 h-full sm:h-[calc(100vh-200px)] flex flex-col rounded-none sm:rounded-[2.5rem] glass shadow-2xl border-white/50 overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right-5 duration-700">
      {/* Header */}
      <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <h3 className="font-black text-[11px] text-rose-600 uppercase tracking-[0.2em] font-sans">Secret Letters 💌</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-rose-100 text-rose-300 hover:text-rose-600 transition-all"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-rose-50/20">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-rose-300 space-y-4 opacity-40">
            <Heart className="size-16 stroke-[1px] fill-rose-100" />
            <p className="text-[10px] font-black uppercase tracking-widest">No letters sent yet</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.userId === socket.id;
          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1.5 px-1">
                {!isMe && <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{msg.userName}</span>}
                <span className="text-[9px] text-rose-300 font-bold">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-5 py-3 rounded-2xl text-[13px] font-medium leading-relaxed max-w-[90%] break-words transition-all hover:scale-[1.02] ${
                isMe 
                ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white rounded-tr-none shadow-lg shadow-rose-200/50' 
                : 'bg-white border border-rose-100 text-rose-700 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-5 border-t border-rose-100 bg-white/60 backdrop-blur-md">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a love letter..."
            className="flex-1 rounded-2xl bg-white border-2 border-rose-50 px-5 py-3 text-xs text-rose-700 placeholder:text-rose-300 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-200/20 transition-all font-bold shadow-inner"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="size-12 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-500 text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-rose-200/50"
          >
            <Send className="size-4 stroke-[3px]" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
