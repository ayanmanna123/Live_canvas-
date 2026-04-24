import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2, ArrowLeft, Trophy, Users, Star, UserPlus, Loader2, X, Check } from 'lucide-react';
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
  const [playerCount, setPlayerCount] = useState(2);
  const [selectedOpponents, setSelectedOpponents] = useState([]);
  const [acceptedOpponents, setAcceptedOpponents] = useState([]);
  const [showPlayerCountModal, setShowPlayerCountModal] = useState(false);

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
          if (gameId === 'ludo') {
            setAcceptedOpponents(prev => {
              const newList = [...prev.filter(u => u.id !== from.id), from];
              setInvitationStatus(`${newList.length} / ${playerCount - 1} players accepted`);
              return newList;
            });
          } else {
            setInvitationStatus('Accepted! Redirecting...');
            setTimeout(() => {
              navigate(`/games/${gameId}`, { 
                state: { roomId: currentRoomId, userName: currentUserName, opponent: from, isInviter: true } 
              });
            }, 1500);
          }
        } else {
          setInvitationStatus(`${from.name} declined the invitation`);
          setTimeout(() => setInvitationStatus(''), 2000);
        }
      };

      const handleGameStart = ({ gameId, participants, inviter }) => {
        if (gameId === 'ludo') {
           navigate(`/games/ludo`, {
             state: { 
               roomId: currentRoomId, 
               userName: currentUserName, 
               opponents: participants.filter(p => p.id !== socket.id),
               isInviter: socket.id === inviter.id,
               playerCount: participants.length
             }
           });
        }
      };

      socket.on('user-list-update', handleUserList);
      socket.on('game-invite-result', handleInviteResult);
      socket.on('receive-game-move', (move) => {
        if (move.type === 'START_GAME') {
            handleGameStart(move);
        }
      });

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
      id: 'snakeandladder',
      name: 'Snake & Ladder',
      description: 'Race to the top! Watch out for snakes and climb the ladders.',
      icon: <Trophy className="size-10 text-emerald-500" />,
      color: 'bg-emerald-100',
      players: '2 Players',
      rating: '5.0',
    },
    {
      id: 'rockpaperscissors',
      name: 'Rock Paper Scissors',
      description: 'The ultimate battle of choices. Blind pick and reveal!',
      icon: <Star className="size-10 text-blue-500" />,
      color: 'bg-blue-100',
      players: '2 Players',
      rating: '4.8',
    },
    {
      id: 'chess',
      name: 'Chess',
      description: 'The ultimate strategy game. Checkmate your opponent!',
      icon: <Gamepad2 className="size-10 text-slate-700" />,
      color: 'bg-slate-200',
      players: '2 Players',
      rating: '5.0',
    },
    {
      id: 'ludo',
      name: 'Ludo',
      description: 'Classic board game fun! Support for 2, 3, or 4 players.',
      icon: <Trophy className="size-10 text-orange-500" />,
      color: 'bg-orange-100',
      players: '2-4 Players',
      rating: '5.0',
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
    if (game.id === 'ludo') {
      setShowPlayerCountModal(true);
    } else {
      setPlayerCount(2);
      setShowOpponentModal(true);
    }
  };

  const toggleOpponent = (user) => {
    setSelectedOpponents(prev => {
      const isSelected = prev.some(o => o.id === user.id);
      if (isSelected) {
        return prev.filter(o => o.id !== user.id);
      } else {
        if (prev.length < playerCount - 1) {
          return [...prev, user];
        }
        return prev;
      }
    });
  };

  const sendInvitations = () => {
    if (!socket || selectedOpponents.length === 0) return;
    setIsInviting(true);
    setInvitationStatus(`Inviting ${selectedOpponents.map(o => o.name).join(', ')}...`);
    
    // For now, we emit separate invites, but the first one who accepts 
    // will trigger the navigation. We'll refine this for multi-player ludo.
    selectedOpponents.forEach(opponent => {
      socket.emit('game-invite', {
        roomId,
        from: { id: socket.id, name: userName },
        to: opponent,
        gameId: selectedGame.id,
        playerCount: playerCount // Include intended player count
      });
    });
  };

  const startGame = () => {
    const participants = [{ id: socket.id, name: userName }, ...acceptedOpponents];
    
    // Broadcast start to everyone in the lobby
    acceptedOpponents.forEach(opponent => {
       socket.emit('game-move', {
         roomId,
         to: opponent,
         move: { type: 'START_GAME', gameId: 'ludo', participants, inviter: { id: socket.id, name: userName } }
       });
    });

    // Navigate self
    navigate(`/games/ludo`, {
      state: { roomId, userName, opponents: acceptedOpponents, isInviter: true, playerCount: participants.length }
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
            onClick={() => {
              const currentRoomId = roomId || sessionStorage.getItem('lastRoomId');
              if (currentRoomId) {
                navigate(`/room/${currentRoomId}`);
              } else {
                navigate('/');
              }
            }}
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

        {/* Player Count Modal for Ludo */}
        {showPlayerCountModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/90 backdrop-blur-3xl w-full max-w-sm rounded-[3rem] p-10 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.3)] border border-white/60 scale-in-center">
              <h2 className="text-3xl font-black text-rose-600 mb-8 text-center font-serif italic">How many players?</h2>
              <div className="grid grid-cols-1 gap-4">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setPlayerCount(count);
                      setShowPlayerCountModal(false);
                      setShowOpponentModal(true);
                      setSelectedOpponents([]);
                    }}
                    className="flex items-center justify-between p-6 rounded-3xl bg-rose-50/50 hover:bg-rose-100/50 border border-rose-100 transition-all hover:scale-[1.02] group"
                  >
                    <span className="text-xl font-bold text-rose-700">{count} Players</span>
                    <Users className="size-6 text-rose-400 group-hover:scale-110 transition-transform" />
                  </button>
                ))}
              </div>
              <Button 
                variant="text" 
                className="w-full mt-6 text-md-on-surface-variant font-bold"
                onClick={() => setShowPlayerCountModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Opponent Selection Modal */}
        {showOpponentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/90 backdrop-blur-3xl w-full max-w-md rounded-[3rem] p-10 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.3)] border border-white/60 scale-in-center">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-black text-rose-600 font-serif italic">Find Opponents</h2>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">
                    Choose {playerCount - 1} more player{playerCount > 2 ? 's' : ''} 💞
                  </p>
                </div>
                <button 
                  onClick={() => { setShowOpponentModal(false); setInvitationStatus(''); setIsInviting(false); setSelectedOpponents([]); }}
                  className="p-3 rounded-full hover:bg-rose-50 text-rose-300 transition-all"
                >
                  <X className="size-6" />
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
                  
                  {selectedGame?.id === 'ludo' && acceptedOpponents.length > 0 && (
                    <Button 
                        onClick={startGame}
                        className="mt-8 h-14 px-12 rounded-2xl bg-md-primary font-black animate-bounce shadow-xl"
                    >
                        START GAME ({acceptedOpponents.length + 1} players)
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-[300px] overflow-y-auto px-1 custom-scrollbar space-y-2">
                    {roomUsers.length > 0 ? (
                      roomUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => toggleOpponent(user)}
                          className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all ${
                            selectedOpponents.some(o => o.id === user.id)
                              ? 'bg-md-primary/20 border-md-primary shadow-md scale-[1.02]'
                              : 'bg-md-surface-container border-md-outline/5 hover:bg-md-primary/10'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black ${
                              selectedOpponents.some(o => o.id === user.id) ? 'bg-md-primary text-md-on-primary' : 'bg-md-primary/10 text-md-primary'
                            }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-md-on-surface">{user.name}</span>
                          </div>
                          {selectedOpponents.some(o => o.id === user.id) ? (
                            <div className="h-6 w-6 rounded-full bg-md-primary flex items-center justify-center text-md-on-primary">
                              <Check className="size-4" />
                            </div>
                          ) : (
                            <UserPlus className="size-5 text-md-on-surface-variant" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-md-on-surface-variant font-medium">No other players online in the room right now.</p>
                      </div>
                    )}
                  </div>

                  <Button
                    disabled={selectedOpponents.length < playerCount - 1 || roomUsers.length === 0}
                    onClick={sendInvitations}
                    className="w-full h-16 rounded-[1.5rem] text-sm font-black uppercase tracking-widest mt-6 bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-xl shadow-rose-200/50 hover:brightness-110"
                  >
                    SEND INVITES ({selectedOpponents.length}/{playerCount - 1})
                  </Button>
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
