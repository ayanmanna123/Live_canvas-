import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';

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
      // Unread count is now managed by CanvasRoom
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
    <div className="fixed inset-0 sm:inset-auto sm:top-24 sm:right-6 z-[60] sm:z-40 w-full sm:w-80 h-full sm:h-[calc(100vh-160px)] flex flex-col rounded-none sm:rounded-3xl glass premium-shadow overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right-5 duration-500">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-black text-[11px] text-white uppercase tracking-[0.2em]">Live Chat</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 opacity-30">
            <MessageSquare className="size-12 stroke-[1px]" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No messages yet</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.userId === socket.id;
          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1.5 px-1">
                {!isMe && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">{msg.userName}</span>}
                <span className="text-[9px] text-slate-500 font-bold">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[90%] break-words transition-all hover:scale-[1.02] ${
                isMe 
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20' 
                : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send message..."
            className="flex-1 rounded-2xl bg-slate-950/50 border border-white/5 px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="size-10 flex items-center justify-center rounded-2xl bg-indigo-600 text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
