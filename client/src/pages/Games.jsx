import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2, ArrowLeft, Trophy, Users, Star, UserPlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/contexts/SocketContext';

const Games = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const { roomId, userName } = location.state || {};
  
  const [roomUsers, setRoomUsers] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState('');

  // Re-join room if we have the info but socket isn't in it (e.g. page refresh)
  useEffect(() => {
    // Try to get room info from state or sessionStorage
    const currentRoomId = roomId || sessionStorage.getItem('lastRoomId');
    const currentUserName = userName || sessionStorage.getItem('lastUserName');

    if (socket && isConnected && currentRoomId && currentUserName) {
      // Persist for refresh
      if (roomId) sessionStorage.setItem('lastRoomId', roomId);
      if (userName) sessionStorage.setItem('lastUserName', userName);

      // Attach listener FIRST
      const handleUserList = (users) => {
        console.log('Received user list:', users);
        setRoomUsers(users.filter(u => u.id !== socket.id));
      };

      const handleInviteResult = ({ from, accepted, gameId }) => {
        if (accepted) {
          setInvitationStatus('Accepted! Redirecting...');
          setTimeout(() => {
            navigate(`/games/${gameId}`, { 
              state: { 
                roomId: currentRoomId, 
                userName: currentUserName, 
                opponent: from, 
                isInviter: true 
              } 
            });
          }, 1500);
        } else {
          setInvitationStatus('Invitation Declined');
          setIsInviting(false);
          setTimeout(() => setInvitationStatus(''), 2000);
        }
      };

      socket.on('user-list-update', handleUserList);
      socket.on('game-invite-result', handleInviteResult);

      // Then emit
      socket.emit('join-room', { roomId: currentRoomId, userName: currentUserName });

      return () => {
        socket.off('user-list-update', handleUserList);
        socket.off('game-invite-result', handleInviteResult);
      };
    }
  }, [socket, isConnected, roomId, userName, navigate]);

  const availableGames = [
    {
      id: 'tictactoe',
      name: 'Tic Tac Toe',
      description: 'The classic game of X and O. Strategy and fun!',
      icon: <Gamepad2 className="size-10 text-pink-500" />,
      color: 'bg-pink-100',
      players: '2 Players',
      rating: '4.9',
    },
    {
      id: 'chess',
      name: 'Chess',
      description: 'The ultimate game of strategy. Coming soon!',
      icon: <Trophy className="size-10 text-blue-500" />,
      color: 'bg-blue-100',
      players: '2 Players',
      rating: '5.0',
      disabled: true
    },
    {
      id: 'drawing',
      name: 'Draw & Guess',
      description: 'Draw with friends and guess the word!',
      icon: <Star className="size-10 text-yellow-500" />,
      color: 'bg-yellow-100',
      players: '2-10 Players',
      rating: '4.8',
      disabled: true
    },
    {
      id: 'quiz',
      name: 'Mega Quiz',
      description: 'Test your knowledge on various topics!',
      icon: <Users className="size-10 text-emerald-500" />,
      color: 'bg-emerald-100',
      players: '1-20 Players',
      rating: '4.7',
      disabled: true
    }
  ];

  const handleGameClick = (game) => {
    if (game.disabled) return;
    setSelectedGame(game);
    setShowOpponentModal(true);
  };

  const sendInvitation = (opponent) => {
    if (!socket) return;
    setIsInviting(true);
    setInvitationStatus(`Inviting ${opponent.name}...`);
    socket.emit('game-invite', {
      roomId,
      from: { id: socket.id, name: userName },
      to: opponent,
      gameId: selectedGame.id
    });
  };

  return (
    <div className="min-h-screen bg-md-background p-4 md:p-8 font-sans selection:bg-md-primary/30 text-md-on-background relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2">
              GAME <span className="text-md-primary">ZONE</span>
            </h1>
            <p className="text-md-on-surface-variant font-medium text-lg italic italic">Choose a game, then invite a friend from your room!</p>
          </div>
          <Button 
            variant="tonal" 
            onClick={() => navigate(-1)}
            className="rounded-2xl h-12 px-6 shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="size-5 mr-2" />
            Return to Room
          </Button>
        </div>

        {/* Games Grid - 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {availableGames.map((game) => (
            <div 
              key={game.id}
              onClick={() => handleGameClick(game)}
              className={`group relative overflow-hidden rounded-[2rem] bg-md-surface-container-low p-6 border border-md-outline/10 shadow-lg transition-all duration-300 ${game.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-md-surface-container hover:border-md-primary/30 hover:-translate-y-2 hover:shadow-2xl cursor-pointer'}`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${game.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  {game.icon}
                </div>
                <h2 className="mb-2 text-2xl font-bold text-md-on-surface">{game.name}</h2>
                <p className="mb-6 text-md-on-surface-variant text-sm line-clamp-2 leading-relaxed flex-grow">{game.description}</p>
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-md-on-surface-variant">
                      <Users className="size-3" />
                      {game.players}
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Opponent Selection Modal */}
        {showOpponentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-md-surface-container-high w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-md-outline/10 scale-in-center">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-md-on-surface">Select Opponent</h2>
                <button 
                  onClick={() => { setShowOpponentModal(false); setInvitationStatus(''); setIsInviting(false); }}
                  className="p-2 rounded-full hover:bg-md-on-surface/10 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {isInviting ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="relative mb-6">
                    <Loader2 className="size-16 text-md-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Gamepad2 className="size-6 text-md-primary" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-md-on-surface">{invitationStatus}</p>
                  <p className="text-md-on-surface-variant mt-2">Waiting for confirmation...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
                  {roomUsers.length > 0 ? (
                    roomUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => sendInvitation(user)}
                        className="w-full flex items-center justify-between p-4 rounded-3xl bg-md-surface-container hover:bg-md-primary/10 border border-md-outline/5 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-md-primary/10 flex items-center justify-center text-md-primary font-black">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-md-on-surface">{user.name}</span>
                        </div>
                        <UserPlus className="size-5 text-md-on-surface-variant group-hover:text-md-primary transition-colors" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-md-on-surface-variant font-medium">No other players online in the room right now.</p>
                      <p className="text-xs text-md-primary mt-2 uppercase font-black tracking-widest cursor-pointer hover:underline" onClick={() => window.location.reload()}>Refresh List</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;
