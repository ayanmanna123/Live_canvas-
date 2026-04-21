import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import Home from './pages/Home';
import CanvasRoom from './pages/CanvasRoom';
import Games from './pages/Games';
import TicTacToePage from './pages/TicTacToePage';
import RockPaperScissorsPage from './pages/RockPaperScissorsPage';
import GameInviteModal from './components/games/GameInviteModal';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen bg-md-background text-md-on-background selection:bg-md-primary/30">
          <GameInviteModal />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<CanvasRoom />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/tictactoe" element={<TicTacToePage />} />
            <Route path="/games/rockpaperscissors" element={<RockPaperScissorsPage />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
