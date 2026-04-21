import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2, X, Check, Bell } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

const GameInviteModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('receive-game-invite', (data) => {
        // Only show if NOT already in that game
        if (!location.pathname.includes(data.gameId)) {
          setInvite(data);
          // Auto-reject after 30 seconds if no response
          setTimeout(() => setInvite(null), 30000);
        }
      });

      return () => {
        socket.off('receive-game-invite');
      };
    }
  }, [socket, isConnected, location.pathname]);

  const respond = (accepted) => {
    if (!socket || !invite) return;
    
    socket.emit('game-invite-response', {
      roomId: invite.roomId,
      from: { id: socket.id, name: localStorage.getItem('live-canvas-username') || 'Guest' },
      to: invite.from,
      accepted,
      gameId: invite.gameId
    });

    if (accepted) {
      navigate(`/games/${invite.gameId}`, {
        state: {
          roomId: invite.roomId,
          userName: localStorage.getItem('live-canvas-username'),
          opponent: invite.from,
          isInviter: false
        }
      });
    }
    setInvite(null);
  };

  if (!invite) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-in slide-in-from-top-10 duration-500">
      <div className="bg-md-surface-container-highest border border-md-primary/20 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-md-primary flex items-center justify-center text-md-on-primary shadow-lg animate-pulse">
            <Gamepad2 className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Bell className="size-3 text-md-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-md-primary">New Invitation</span>
            </div>
            <h4 className="font-black text-md-on-surface text-lg leading-tight">
              {invite.from.name} <span className="font-normal text-md-on-surface-variant">invited you!</span>
            </h4>
            <p className="text-xs font-bold text-md-on-surface-variant uppercase">Game: {invite.gameId === 'tictactoe' ? 'Tic Tac Toe' : invite.gameId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => respond(false)}
            className="h-12 w-12 rounded-full bg-md-surface-container hover:bg-red-500/10 text-md-on-surface-variant hover:text-red-500 transition-all flex items-center justify-center"
          >
            <X className="size-6" />
          </button>
          <button 
            onClick={() => respond(true)}
            className="h-12 w-14 rounded-[1.25rem] bg-md-primary text-md-on-primary hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
          >
            <Check className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameInviteModal;
