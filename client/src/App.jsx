import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import Home from './pages/Home';
import CanvasRoom from './pages/CanvasRoom';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<CanvasRoom />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
