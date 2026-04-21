import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import './TicTacToe.css';

const TicTacToe = () => {
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const { roomId, userName, opponent, isInviter } = location.state || {};

  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winLine, setWinLine] = useState(null);
  const [scores, setScores] = useState({ x: 0, o: 0 });
  const [round, setRound] = useState(1);

  // My role: Inviter is 'X', Invitee is 'O'
  const mySymbol = isInviter ? 'X' : 'O';
  const isMyTurn = (isXNext && mySymbol === 'X') || (!isXNext && mySymbol === 'O');

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('receive-game-move', (moveIndex) => {
        handleMove(moveIndex, false);
      });

      socket.on('receive-game-reset', () => {
        resetGame(false);
      });

      return () => {
        socket.off('receive-game-move');
        socket.off('receive-game-reset');
      };
    }
  }, [socket, isConnected, board, isXNext, winner]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return null;
  };

  const handleMove = (i, isLocal = true) => {
    if (winner || board[i]) return;
    if (isLocal && !isMyTurn) return; // Prevent clicking out of turn

    const newBoard = [...board];
    newBoard[i] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    
    if (isLocal && socket) {
      socket.emit('game-move', { roomId, to: opponent, move: i });
    }

    const winInfo = calculateWinner(newBoard);
    if (winInfo) {
      setWinner(winInfo.winner);
      setWinLine(winInfo.line);
      setScores(prev => ({
        ...prev,
        [winInfo.winner.toLowerCase()]: prev[winInfo.winner.toLowerCase()] + 1
      }));
    } else if (!newBoard.includes(null)) {
      setWinner('Draw');
    } else {
      setIsXNext(!isXNext);
    }
  };

  const resetGame = (isLocal = true) => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinLine(null);
    if (winner && winner !== 'Draw') {
      setRound(prev => prev + 1);
    }

    if (isLocal && socket) {
      socket.emit('game-reset', { roomId, to: opponent });
    }
  };

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="ttt-container">
      <div className="ttt-card shadow-2xl">
        <div className="ttt-header">
          <h1 className="ttt-title">
            TIC <span className="text-red-500">TAC</span> TOE
          </h1>
          <div className="ttt-round-circle">
            <span className="ttt-round-num">{getOrdinal(round)}</span>
            <span className="ttt-round-label">Round</span>
          </div>
        </div>

        <div className="ttt-main-content">
          {/* Player Left: Always 'X' (Inviter) */}
          <div className={`ttt-player-card ${isXNext && !winner ? 'active' : ''}`}>
            <div className="ttt-avatar-container">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${isInviter ? userName : opponent?.name}`} alt="Avatar" className="ttt-avatar" />
            </div>
            <h3 className="ttt-player-name truncate max-w-[100px]">{isInviter ? 'You (Me)' : opponent?.name}</h3>
            <div className="ttt-player-icon-box x-box">
              <span className="ttt-icon-x">X</span>
            </div>
            <div className="ttt-win-rounds">
              Win Rounds: {scores.x}
            </div>
          </div>

          <div className="ttt-board-container">
            <div className="ttt-board shadow-inner">
              {board.map((cell, i) => (
                <div 
                  key={i} 
                  className={`ttt-cell ${winLine?.includes(i) ? 'winning' : ''} ${cell ? 'filled' : ''} cell-${i} ${!isMyTurn && !winner && !cell ? 'cursor-not-allowed opacity-50' : ''}`}
                  onClick={() => handleMove(i)}
                >
                  {cell && (
                    <span className={`ttt-mark animate-in zoom-in duration-300 ${cell === 'X' ? 'mark-x' : 'mark-o'}`}>
                      {cell}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Player Right: Always 'O' (Invitee) */}
          <div className={`ttt-player-card ${!isXNext && !winner ? 'active' : ''}`}>
            <div className="ttt-avatar-container">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${!isInviter ? userName : opponent?.name}`} alt="Avatar" className="ttt-avatar" />
            </div>
            <h3 className="ttt-player-name truncate max-w-[100px]">{!isInviter ? 'You (Me)' : opponent?.name}</h3>
            <div className="ttt-player-icon-box o-box">
              <span className="ttt-icon-o">O</span>
            </div>
            <div className="ttt-win-rounds">
              Win Rounds: {scores.o}
            </div>
          </div>
        </div>

        <div className="ttt-footer">
          {winner ? (
            <button className="ttt-turn-btn winner-btn animate-bounce" onClick={() => resetGame()}>
              {winner === 'Draw' ? "IT'S A DRAW!" : `${winner === mySymbol ? 'YOU WON!' : 'THEY WON!'}`} - RESET
            </button>
          ) : (
            <div className={`ttt-turn-btn ${isMyTurn ? 'active-turn bg-emerald-500 text-white' : 'opacity-50'}`}>
              {isMyTurn ? "YOUR TURN" : "WAITING FOR OPPONENT..."}
            </div>
          )}
        </div>

        {!isConnected && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-[40px]">
                <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
                    <p className="text-red-500 font-bold">Lost connection to server...</p>
                    <p className="text-xs text-slate-500 mt-1">Check your internet connection.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TicTacToe;
