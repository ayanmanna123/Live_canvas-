import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import './RockPaperScissors.css';

const RockPaperScissors = () => {
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const { roomId, userName, opponent, isInviter } = location.state || {};

  const [myChoice, setMyChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'win', 'loss', 'draw'
  const [totalScores, setTotalScores] = useState({ p1: 0, p2: 0, draws: 0 });
  const [showResultOverlay, setShowResultOverlay] = useState(false);

  const choices = [
    { id: 'rock', name: 'Rock', icon: '✊', beats: 'scissors' },
    { id: 'paper', name: 'Paper', icon: '✋', beats: 'rock' },
    { id: 'scissors', name: 'Scissors', icon: '✌️', beats: 'paper' }
  ];

  useEffect(() => {
    if (socket && isConnected && opponent) {
      // Fetch historical scores
      socket.emit('get-game-score', { 
        gameId: 'rockpaperscissors', 
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

      socket.on('receive-game-move', (moveId) => {
        setOpponentChoice(moveId);
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
  }, [socket, isConnected, opponent, userName, isInviter]);

  // Check for result when both choices are made
  useEffect(() => {
    if (myChoice && opponentChoice && !isRevealing && !gameResult) {
      setIsRevealing(true);
      
      // Delay to show shaking animation
      setTimeout(() => {
        determineWinner();
      }, 2500);
    }
  }, [myChoice, opponentChoice]);

  const determineWinner = () => {
    const myChoiceData = choices.find(c => c.id === myChoice);
    
    let result;
    if (myChoice === opponentChoice) {
      result = 'draw';
    } else if (myChoiceData.beats === opponentChoice) {
      result = 'win';
    } else {
      result = 'loss';
    }

    setGameResult(result);
    setIsRevealing(false);
    setShowResultOverlay(true);

    // Update Scores in DB (ONLY the inviter should do this to avoid double counting)
    if (socket && isInviter) {
      socket.emit('update-game-score', {
        roomId,
        gameId: 'rockpaperscissors',
        player1: userName,
        player2: opponent.name,
        winner: result === 'win' ? userName : (result === 'loss' ? opponent.name : 'Draw')
      });
    }
  };

  const handleChoice = (id) => {
    if (myChoice || isRevealing) return;
    setMyChoice(id);
    if (socket) {
      socket.emit('game-move', { roomId, to: opponent, move: id });
    }
  };

  const handleReset = (isLocal = true) => {
    setMyChoice(null);
    setOpponentChoice(null);
    setGameResult(null);
    setIsRevealing(false);
    setShowResultOverlay(false);
    
    if (isLocal && socket) {
      socket.emit('game-reset', { roomId, to: opponent });
    }
  };

  return (
    <div className="rps-container">
      <div className="rps-card shadow-2xl">
        <div className="rps-header">
          <h1 className="rps-title">
            ROCK <span className="text-blue-500">PAPER</span> SCISSORS
          </h1>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Multiplayer Mode</span>
            <span className="text-sm font-black text-blue-500">Live Match</span>
          </div>
        </div>

        {/* Total Score Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 flex justify-between items-center mb-10 border border-slate-200 dark:border-white/5">
            <div className="text-center px-4">
                <p className="text-[10px] uppercase font-bold text-slate-500">
                  {isInviter ? 'You' : opponent?.name}
                </p>
                <p className="text-2xl font-black">{totalScores.p1}</p>
            </div>
            <div className="flex-1 flex justify-center items-center gap-4">
                <div className="h-10 w-[1px] bg-slate-300 dark:bg-white/10" />
                <div className="text-center px-4">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Draws</p>
                    <p className="text-lg font-black text-slate-400">{totalScores.draws}</p>
                </div>
                <div className="h-10 w-[1px] bg-slate-300 dark:bg-white/10" />
            </div>
            <div className="text-center px-4">
                <p className="text-[10px] uppercase font-bold text-slate-500">
                  {!isInviter ? 'You' : opponent?.name}
                </p>
                <p className="text-2xl font-black">{totalScores.p2}</p>
            </div>
        </div>

        <div className="rps-gamearea relative">
          {/* My Side */}
          <div className="rps-player-side">
            <span className={`rps-status-pill ${myChoice ? 'status-ready' : 'status-waiting'}`}>
              {myChoice ? 'Ready!' : 'Picking...'}
            </span>
            <div className="rps-hand-container">
              <span className={`rps-hand-preview ${isRevealing ? 'shaking' : ''}`}>
                {(gameResult && !isRevealing) ? choices.find(c => c.id === myChoice)?.icon : '✊'}
              </span>
            </div>
            <h3 className="text-xl font-black mt-2">You</h3>
          </div>

          <div className="rps-vs-badge shadow-xl">VS</div>

          {/* Opponent Side */}
          <div className="rps-player-side">
            <span className={`rps-status-pill ${opponentChoice ? 'status-ready' : 'status-waiting'}`}>
              {opponentChoice ? 'Ready!' : 'Thinking...'}
            </span>
            <div className="rps-hand-container">
              <span className={`rps-hand-preview ${isRevealing ? 'shaking' : ''}`} style={{ transform: 'scaleX(-1)' }}>
                {(gameResult && !isRevealing) ? choices.find(c => c.id === opponentChoice)?.icon : '✊'}
              </span>
            </div>
            <h3 className="text-xl font-black mt-2">{opponent?.name}</h3>
          </div>

          {/* Result Overlay */}
          {showResultOverlay && (
            <div className="rps-result-overlay rounded-[40px]">
              <p className="text-xl font-bold uppercase tracking-[0.5em] mb-4">The Result</p>
              <h2 className="rps-result-text">
                {gameResult === 'win' ? 'VICTORY!' : (gameResult === 'loss' ? 'DEFEAT' : 'DRAW')}
              </h2>
              <p className="mb-8 opacity-90 text-lg">
                {gameResult === 'win' ? 'You played brilliantly!' : (gameResult === 'loss' ? 'Better luck next time!' : 'A well matched battle!')}
              </p>
              <button className="rps-restart-btn shadow-2xl" onClick={() => handleReset()}>
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Choice Selection Grid */}
        {!myChoice && !showResultOverlay && (
          <div className="rps-choices-grid animate-in slide-in-from-bottom-10 fade-in duration-500">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                className="rps-choice-btn group"
              >
                <span className="rps-choice-icon group-hover:scale-125 transition-transform">{choice.icon}</span>
                <span className="rps-choice-label">{choice.name}</span>
              </button>
            ))}
          </div>
        )}

        {myChoice && !opponentChoice && (
          <div className="text-center mt-10">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-bold">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              Waiting for {opponent?.name} to pick...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RockPaperScissors;
