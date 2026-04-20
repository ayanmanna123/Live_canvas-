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
    <div className="fixed inset-0 sm:inset-auto sm:top-24 sm:right-6 z-[60] sm:z-40 w-full sm:w-80 h-full sm:h-[calc(100vh-120px)] flex flex-col rounded-none sm:rounded-3xl bg-slate-900/95 sm:bg-slate-900/80 backdrop-blur-2xl sm:backdrop-blur-xl border-none sm:border border-white/10 shadow-2xl ring-0 sm:ring-1 ring-white/10 overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right-5 duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Live Chat</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
            <MessageSquare className="h-8 w-8 opacity-20" />
            <p className="text-xs">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.userId === socket.id;
          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1">
                {!isMe && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">{msg.userName}</span>}
                <span className="text-[9px] text-slate-500">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words ${
                isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20' 
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
            placeholder="Type a message..."
            className="flex-1 rounded-xl bg-slate-950 border-none px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
