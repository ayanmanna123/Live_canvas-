import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Paintbrush, ArrowRight, Plus } from 'lucide-react';

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-y-auto bg-slate-950 px-4 py-12">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="h-full w-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="z-10 w-full max-w-md space-y-8 text-center">
        {/* Header */}
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <Paintbrush className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Live<span className="text-indigo-500">Canvas</span>
          </h1>
          <p className="mx-auto max-w-xs text-slate-400">
            Real-time collaborative drawing for teams and creative minds.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl">
          <div className="space-y-6 text-left">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-slate-300 mb-2">
                Your Display Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom(e)}
                placeholder="e.g. Pablo Picasso"
                className="w-full rounded-xl border-none bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                required
              />
            </div>

            <div className="h-px bg-white/5" />

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handleCreateRoom}
                className="group flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="h-5 w-5" />
                Create New Room
              </button>

              <div className="relative py-2 text-center">
                <span className="bg-slate-950 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Or Join Existing
                </span>
                <div className="absolute inset-y-1/2 left-0 -z-10 h-px w-full bg-white/5" />
              </div>

              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Paste room ID"
                  className="flex-1 rounded-xl border-none bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <button
                  type="submit"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-indigo-600 transition-all group shadow-md"
                >
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            </div>
            {!userName.trim() && (
              <p className="mt-2 text-[10px] text-red-400 text-center animate-pulse">
                Please enter a display name first
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-xs text-slate-500">
          No sign-up required. Just create and share the link.
        </p>
      </div>
    </div>
  );
};

export default Home;
