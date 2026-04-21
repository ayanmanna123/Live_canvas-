import React from 'react';
import TicTacToe from '../components/games/TicTacToe/TicTacToe';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const TicTacToePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fce4ec] flex flex-col items-center justify-center p-4">
      <div className="fixed top-6 left-6 z-50">
        <Button 
          variant="outline" 
          onClick={() => navigate('/games')}
          className="rounded-2xl border-white/20 bg-white/10 backdrop-blur-md text-slate-800 hover:bg-white/20 shadow-xl"
        >
          <ArrowLeft className="size-4 mr-2" />
          Games Menu
        </Button>
      </div>
      
      <div className="w-full max-w-4xl animate-in zoom-in fade-in duration-500">
        <TicTacToe />
      </div>

      <div className="mt-8 text-slate-500 text-sm font-medium animate-in slide-in-from-bottom-4 duration-700 delay-300">
        Playing locally with a friend
      </div>
    </div>
  );
};

export default TicTacToePage;
