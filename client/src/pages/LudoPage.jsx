import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Ludo from '../components/games/Ludo/Ludo';
import { Button } from '@/components/ui/button';

const LudoPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId, userName, opponent, opponents, isInviter, playerCount } = location.state || {};

    if (!roomId || !userName) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">SESSION EXPIRED</h1>
                <p className="text-slate-400 mb-8 max-w-md">We couldn't find your game session. Please return to the games portal and start a new match.</p>
                <Button onClick={() => navigate('/games')} className="rounded-2xl h-12 px-8">
                    Go to Games Portal
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-orange-500/30 overflow-x-hidden">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate('/games')}
                            className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <ArrowLeft className="size-6" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight uppercase">Ludo <span className="text-orange-500">Master</span></h1>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multiplayer Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-8 px-4">
                <Ludo 
                    roomId={roomId} 
                    userName={userName} 
                    opponent={opponent} // For compatibility
                    opponents={opponents} // List of opponents for 3/4 players
                    isInviter={isInviter}
                    playerCount={playerCount || 2}
                />
            </main>
        </div>
    );
};

export default LudoPage;
