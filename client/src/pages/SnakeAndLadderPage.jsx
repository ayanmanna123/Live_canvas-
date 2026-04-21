import React from 'react';
import SnakeAndLadder from '../components/games/SnakeAndLadder/SnakeAndLadder';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SnakeAndLadderPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-md-surface-container-lowest flex flex-col overflow-hidden">
      <div className="p-2 md:p-4 flex items-center justify-between">
        <Button 
          variant="tonal" 
          onClick={() => navigate('/games')}
          className="rounded-2xl h-10 px-4 shadow-md transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Games
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-md-on-surface-variant">Snake & Ladder Live</span>
        </div>
      </div>
      
      <div className="flex-grow flex items-center justify-center p-2">
        <SnakeAndLadder />
      </div>
    </div>
  );
};

export default SnakeAndLadderPage;
