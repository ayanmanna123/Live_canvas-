import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useLocation } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import './SnakeAndLadder.css';

const SnakeAndLadder = () => {
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const { roomId, userName, opponent, isInviter } = location.state || {};

  const [p1Pos, setP1Pos] = useState(1);
  const [p2Pos, setP2Pos] = useState(1);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState(isInviter ? userName : opponent?.name);
  const [gameWinner, setGameWinner] = useState(null);
  const [totalScores, setTotalScores] = useState({ p1: 0, p2: 0, draws: 0 });
  const [boardIndex, setBoardIndex] = useState(0);

  const isMyTurn = currentPlayerTurn === userName;


  const boardVariants = [
    {
      name: "Standard",
      ladders: { 2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94 },
      snakes: { 16: 6, 46: 25, 49: 11, 62: 19, 64: 60, 74: 53, 89: 68, 92: 88, 95: 75, 99: 80 }
    },
    {
      name: "Dangerous",
      ladders: { 4: 14, 12: 33, 23: 45, 36: 55, 43: 65, 58: 77, 69: 88, 75: 96 },
      snakes: { 17: 7, 29: 9, 38: 15, 54: 34, 62: 42, 81: 41, 91: 71, 94: 74, 99: 10 }
    },
    {
      name: "Highway",
      ladders: { 3: 50, 10: 32, 27: 76, 48: 88, 59: 98 },
      snakes: { 24: 1, 35: 12, 49: 18, 67: 46, 84: 54, 93: 73, 97: 66, 99: 4 }
    }
  ];

  const { snakes, ladders } = boardVariants[boardIndex];

  const getCellCoords = useCallback((pos) => {
    const row = Math.floor((pos - 1) / 10);
    const col = (pos - 1) % 10;
    const x = row % 2 === 0 ? col : 9 - col;
    const y = 9 - row;
    return { x: x * 50 + 13, y: y * 50 + 13 }; // Offset for pawn size
  }, []);

  const handleReset = useCallback((isLocal = true) => {
    setP1Pos(1);
    setP2Pos(1);
    setDiceValue(1);
    setGameWinner(null);
    setIsAnimating(false);
    setIsRolling(false);
    setCurrentPlayerTurn(isInviter ? userName : opponent?.name);

    if (isLocal && socket) {
      socket.emit('game-reset', { roomId, to: opponent });
    }
  }, [socket, roomId, opponent, userName, isInviter]);

  const performSequence = useCallback(async (isLocal, dice, startPos) => {
    setIsRolling(false);
    setDiceValue(dice);
    setIsAnimating(true);

    const setPos = isLocal ? setP1Pos : setP2Pos;
    
    // 1. Move step by step
    let currentPos = startPos;
    const canMove = startPos + dice <= 100;

    if (canMove) {
      for (let i = 1; i <= dice; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        currentPos++;
        setPos(currentPos);
      }
    }

    // 2. Check for Snakes or Ladders
    let finalPos = currentPos;

    if (ladders[finalPos]) {
      await new Promise(resolve => setTimeout(resolve, 600));
      finalPos = ladders[finalPos];
      setPos(finalPos);
    } else if (snakes[finalPos]) {
      await new Promise(resolve => setTimeout(resolve, 600));
      finalPos = snakes[finalPos];
      setPos(finalPos);
    }

    // 3. Handle Win Condition
    if (finalPos === 100) {
      setGameWinner(isLocal ? userName : opponent.name);
      if (isLocal && isInviter && socket) {
        socket.emit('update-game-score', {
          roomId,
          gameId: 'snakeandladder',
          player1: userName,
          player2: opponent.name,
          winner: userName
        });
      }
    }

    // 4. Turn Logic (6 gives extra turn)
    const nextTurn = dice === 6 ? (isLocal ? userName : opponent.name) : (isLocal ? opponent.name : userName);
    setCurrentPlayerTurn(nextTurn);
    setIsAnimating(false);

    // 5. Sync with socket if local
    if (isLocal && socket) {
      socket.emit('game-move', { 
        roomId, 
        to: opponent, 
        move: { 
          type: 'MOVE',
          dice, 
          finalPos, 
          nextTurn,
          boardIndex,
          startPos // Include startPos for remote sync
        } 
      });
    }
  }, [socket, roomId, opponent, userName, isInviter, boardIndex, ladders, snakes]);

  const handleRemoteRoll = useCallback((data) => {
    const { dice, boardIndex: remoteBoardIndex, startPos } = data;
    
    if (remoteBoardIndex !== undefined && remoteBoardIndex !== boardIndex) {
      setBoardIndex(remoteBoardIndex);
    }

    setIsRolling(true);
    // Remote player sees same 1.5s dice roll animation
    const remoteStartPos = startPos || p2Pos;
    setTimeout(() => {
      performSequence(false, dice, remoteStartPos);
    }, 1500);
  }, [boardIndex, p2Pos, performSequence]);

  // 1. Initial Setup: Inviter picks board once
  useEffect(() => {
    if (isInviter && socket && isConnected && opponent) {
      const randomIdx = Math.floor(Math.random() * boardVariants.length);
      setBoardIndex(randomIdx);
      socket.emit('game-move', { roomId, to: opponent, move: { type: 'SETUP_BOARD', boardIndex: randomIdx } });
    }
  }, [isInviter, socket, isConnected, opponent, roomId]);

  // 2. Main Sync Logic
  useEffect(() => {
    if (socket && isConnected && opponent) {
      socket.emit('get-game-score', { 
        gameId: 'snakeandladder', 
        player1: userName, 
        player2: opponent.name 
      });

      socket.on('receive-game-score', (scoreData) => {

        const sortedPlayers = [userName, opponent.name].sort();
        const leftPlayerName = isInviter ? userName : opponent.name;
        if (leftPlayerName === sortedPlayers[0]) {
          setTotalScores({ p1: scoreData.score1, p2: scoreData.score2, draws: scoreData.draws });
        } else {
          setTotalScores({ p1: scoreData.score2, p2: scoreData.score1, draws: scoreData.draws });
        }
      });

      socket.on('receive-game-move', (data) => {
        if (data.type === 'SETUP_BOARD') {
          setBoardIndex(data.boardIndex);
        } else {
          handleRemoteRoll(data);
        }
      });

      socket.on('receive-game-reset', () => {
        handleReset(false);
      });

      return () => {
        socket.off('receive-game-score');
        socket.off('receive-game-move');
        socket.off('receive-game-reset');
      };
    }
  }, [socket, isConnected, opponent, userName, isInviter, handleRemoteRoll, handleReset, boardVariants.length]);

  const rollDice = () => {
    if (!isMyTurn || isRolling || isAnimating || gameWinner) return;

    setIsRolling(true);
    const dice = Math.floor(Math.random() * 6) + 1;
    const currentPos = p1Pos;
    
    // Wait for dice animation
    setTimeout(() => {
      performSequence(true, dice, currentPos);
    }, 1500);
  };


  const renderGrid = () => {
    const cells = [];
    for (let i = 100; i >= 1; i--) {
      cells.push(<div key={i} className="sl-cell">{i}</div>);
    }
    return cells;
  };

  // SVG Helper for lines
  const renderPath = (start, end, type) => {
    const c1 = getCellCoords(start);
    const c2 = getCellCoords(end);
    return (
      <line 
        key={`${type}-${start}`} 
        x1={c1.x + 12} y1={c1.y + 12} 
        x2={c2.x + 12} y2={c2.y + 12} 
        className={type === 'ladder' ? 'ladder-line' : 'snake-line'} 
      />
    );
  };

  const myPawnPos = getCellCoords(p1Pos);
  const oppPawnPos = getCellCoords(p2Pos);

  return (
    <div className="sl-container">
      <div className="sl-card shadow-2xl">
        <div className="sl-header">
          <h1 className="text-3xl font-black italic">SNAKE <span className="text-emerald-500 font-extrabold">&</span> LADDER</h1>
          <div className={`sl-turn-indicator ${isMyTurn ? 'turn-mine' : 'turn-theirs'}`}>
            {isMyTurn ? "Your Turn" : `${opponent?.name}'s Turn`}
          </div>
        </div>

        {/* Total Score Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 flex justify-between items-center mb-6 border border-slate-200 dark:border-white/5">
            <div className="text-center px-4">
                <p className="text-[10px] uppercase font-bold text-slate-500">{isInviter ? 'You' : opponent?.name}</p>
                <p className="text-2xl font-black">{totalScores.p1}</p>
            </div>
            <div className="text-center px-4">
                <p className="text-[10px] uppercase font-bold text-slate-500">{!isInviter ? 'You' : opponent?.name}</p>
                <p className="text-2xl font-black">{totalScores.p2}</p>
            </div>
        </div>

        <div className="sl-game-layout">
          <div className="sl-board-container shadow-inner">
            <div className="sl-grid" style={{ gridAutoRows: '50px' }}>
              {/* Note: CSS Grid handles the visual 10x10, numbers 100 to 1 */}
              {[...Array(10)].map((_, r) => (
                [...Array(10)].map((_, c) => {
                  const row = 9 - r;
                  const col = row % 2 === 0 ? c : 9 - c;
                  const num = row * 10 + col + 1;
                  return <div key={num} className="sl-cell">{num}</div>;
                })
              ))}
            </div>

            <svg className="sl-svg-overlay">
              {Object.entries(ladders).map(([start, end]) => renderPath(parseInt(start), end, 'ladder'))}
              {Object.entries(snakes).map(([start, end]) => renderPath(parseInt(start), end, 'snake'))}
            </svg>

            {/* My Pawn */}
            <div 
              className="sl-pawn pawn-p1" 
              style={{ left: `${myPawnPos.x}px`, top: `${myPawnPos.y}px` }} 
            />
            {/* Opponent Pawn */}
            <div 
              className="sl-pawn pawn-p2" 
              style={{ left: `${oppPawnPos.x}px`, top: `${oppPawnPos.y}px` }} 
            />
          </div>

          <div className="sl-controls">
            <div className="sl-dice-container shadow-sm border border-slate-200 dark:border-white/5">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-widest">Dice Controller</span>
              <div className={`sl-dice ${isRolling ? 'rolling' : ''} shadow-xl`}>
                {diceValue}
              </div>
              <button 
                className="sl-roll-btn" 
                onClick={rollDice}
                disabled={!isMyTurn || isRolling || isAnimating || gameWinner}
              >
                {isRolling ? 'ROLLING...' : isAnimating ? 'MOVING...' : 'ROLL DICE'}
              </button>

            </div>

            <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5">
                <h4 className="text-sm font-black mb-4 uppercase tracking-tighter">Match Info</h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm">
                        <span className="text-xs font-bold text-slate-500 uppercase">Your Position</span>
                        <span className="text-lg font-black text-emerald-500">{p1Pos}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm">
                        <span className="text-xs font-bold text-slate-500 uppercase">{opponent?.name}</span>
                        <span className="text-lg font-black text-rose-500">{p2Pos}</span>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {gameWinner && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 text-center shadow-2xl max-w-sm border border-emerald-500/20">
               <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-4xl shadow-lg">🏆</div>
               <h2 className="text-3xl font-black mb-2">{gameWinner === userName ? 'VICTORY!' : 'DEFEAT'}</h2>
               <p className="text-slate-500 mb-8">{gameWinner === userName ? 'You reached the summit!' : 'Opponent climbed faster!'}</p>
               <button className="sl-roll-btn" onClick={() => handleReset()}>REMATCH</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnakeAndLadder;
