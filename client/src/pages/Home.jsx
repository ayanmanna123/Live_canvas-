import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Paintbrush, ArrowRight, Plus, Sparkles, Heart, Code2 } from 'lucide-react';
import FloatingHearts from '../components/FloatingHearts';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('live-canvas-username') || '');
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!userName.trim()) return;
    localStorage.setItem('live-canvas-username', userName.trim());
    const newRoomId = nanoid(8);
    navigate(`/room/${newRoomId}`, { state: { userName } });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!userName.trim() || !roomId.trim()) return;
    localStorage.setItem('live-canvas-username', userName.trim());
    navigate(`/room/${roomId.trim()}`, { state: { userName } });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FFF0F5] px-4 py-12 font-sans selection:bg-rose-200 selection:text-rose-700">
      <FloatingHearts />
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-rose-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-pink-200/40 blur-[120px]" />
        <div className="h-full w-full bg-[radial-gradient(#ffb6c1_1px,transparent_1px)] [background-size:40px_40px] opacity-20" />
      </div>

      <div className="z-10 w-full max-w-md space-y-10 text-center">
        {/* Header */}
        <div className="space-y-4 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white shadow-xl shadow-rose-200/50 heart-pulse overflow-hidden p-3">
            <img src="/logo.svg" alt="LoveCanvas Logo" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-rose-600 font-serif italic">
              Love<span className="text-pink-400">Canvas</span>
            </h1>
            <p className="mx-auto max-w-xs text-rose-400 font-bold uppercase tracking-widest text-[10px]">
              A Shared Digital Space for Couples
            </p>
          </div>
          <p className="mx-auto max-w-sm text-rose-500/80 font-medium font-serif italic text-lg">
            "Draw together, leave love notes, and create beautiful memories in your private space."
          </p>
        </div>

        {/* Form */}
        <div className="rounded-[3rem] border border-white/60 bg-white/40 p-10 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-700 delay-200">
          <div className="space-y-8 text-left">
            <div>
              <label htmlFor="userName" className="block text-xs font-black text-rose-400 uppercase tracking-widest mb-3 px-1">
                Who are you? 💞
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom(e)}
                placeholder="e.g. Romeo / Juliet"
                className="w-full rounded-2xl border-2 border-rose-50 bg-white/50 px-5 py-4 text-rose-700 placeholder:text-rose-300 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-200/30 transition-all font-bold shadow-inner"
                required
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCreateRoom}
                disabled={!userName.trim()}
                className="group w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 px-6 py-4 font-black text-white hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-rose-200/50 disabled:opacity-50 disabled:grayscale"
              >
                <Plus className="h-5 w-5 stroke-[3px]" />
                <span className="uppercase tracking-widest text-sm">Create Memory Room</span>
              </button>

              <div className="relative py-2 text-center">
                <span className="bg-[#FFF0F5] px-4 text-[10px] font-black uppercase tracking-[0.3em] text-rose-300">
                  Or Join Yours
                </span>
                <div className="absolute inset-y-1/2 left-0 -z-10 h-px w-full bg-rose-100" />
              </div>

              <form onSubmit={handleJoinRoom} className="flex gap-3">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Paste Memory ID"
                  className="flex-1 rounded-2xl border-2 border-rose-50 bg-white/50 px-5 py-4 text-rose-700 placeholder:text-rose-300 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-200/30 transition-all font-bold shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!userName.trim() || !roomId.trim()}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all group shadow-md disabled:opacity-50"
                >
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform stroke-[3px]" />
                </button>
              </form>
            </div>
            
            {!userName.trim() && (
              <p className="text-[10px] text-rose-400 font-black text-center uppercase tracking-widest animate-pulse">
                Please enter your name first darling
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="space-y-4 opacity-60">
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">
            No login required • Fully encrypted • Forever yours
          </p>
          
          <button 
            onClick={() => navigate('/developers')}
            className="group inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
          >
            <Code2 className="size-3" />
            Meet the Developers
          </button>

          <div className="flex justify-center gap-4 text-rose-300">
             <Heart className="size-4 fill-current" />
             <Sparkles className="size-4" />
             <Heart className="size-4 fill-current" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
