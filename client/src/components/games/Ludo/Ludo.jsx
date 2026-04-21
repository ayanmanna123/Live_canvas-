import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { LudoEngine } from './LudoEngine';
import Board from './Board';
import Dice from './Dice';
import { BaseID } from './Constants';
import { Button } from '@/components/ui/button';
import './Ludo.css';

const Ludo = ({ roomId, userName, isInviter, playerCount, opponents }) => {
    const { socket } = useSocket();
    const [engine, setEngine] = useState(new LudoEngine(playerCount));
    const [myBase, setMyBase] = useState(null);
    const [gameStatus, setGameStatus] = useState('WAITING'); // WAITING, PLAYING, FINISHED
    const engineRef = useRef(engine);

    // Sync ref
    useEffect(() => {
        engineRef.current = engine;
    }, [engine]);

    // Initialize players and roles
    useEffect(() => {
        if (!socket) return;

        // Determine player role based on sort order or inviter status
        // Simplest: Inviter is BASE_1, others follow in order of acceptance or sort
        // For now, let's use a fixed assignment or pass it through state
        
        // Let's assume the participants are sorted alphabetically to avoid confusion
        const allParticipants = [
            { id: socket.id, name: userName },
            ...(Array.isArray(opponents) ? opponents : [])
        ].sort((a, b) => a.name.localeCompare(b.name));

        const myIndex = allParticipants.findIndex(p => p.id === socket.id);
        const roles = [BaseID.BASE_1, BaseID.BASE_2, BaseID.BASE_3, BaseID.BASE_4];
        setMyBase(roles[myIndex]);
        setGameStatus('PLAYING');
    }, [socket, userName, opponents]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleMove = (moveData) => {
            const { type, coinID, diceValue, baseID } = moveData;
            const newEngine = Object.assign(Object.create(Object.getPrototypeOf(engineRef.current)), engineRef.current);
            
            if (type === 'ROLL') {
                newEngine.diceValue = diceValue;
                newEngine.isDiceRolled = true;
                // If it was an auto-skip
                if (moveData.noMoves) {
                    newEngine.nextTurn();
                }
            } else if (type === 'MOVE') {
                newEngine.diceValue = diceValue;
                newEngine.isDiceRolled = true;
                newEngine.moveCoin(coinID);
            } else if (type === 'SPAWN') {
                newEngine.diceValue = 6;
                newEngine.spawnCoin(coinID);
            } else if (type === 'RESET') {
                newEngine.reset();
            }

            setEngine(newEngine);
        };

        socket.on('receive-game-move', handleMove);
        socket.on('receive-game-reset', () => {
            const newEngine = new LudoEngine(playerCount);
            setEngine(newEngine);
        });

        return () => {
            socket.off('receive-game-move');
            socket.off('receive-game-reset');
        };
    }, [socket, playerCount]);

    const handleRollDice = () => {
        if (engine.currentTurn !== myBase || engine.isDiceRolled) return;

        const result = engine.rollDice();
        const newEngine = Object.assign(Object.create(Object.getPrototypeOf(engine)), engine);
        setEngine(newEngine);

        socket.emit('game-move', {
            roomId,
            to: { id: roomId }, // Broadcast to all
            move: { type: 'ROLL', diceValue: result.diceValue, noMoves: result.noMoves, baseID: myBase }
        });

        if (result.noMoves) {
            setTimeout(() => {
                const skipEngine = Object.assign(Object.create(Object.getPrototypeOf(newEngine)), newEngine);
                skipEngine.nextTurn();
                setEngine(skipEngine);
            }, 1000);
        }
    };

    const handlePawnClick = (coinID) => {
        if (engine.currentTurn !== myBase || !engine.isDiceRolled) return;
        
        const coin = engine.coins[coinID];
        const newEngine = Object.assign(Object.create(Object.getPrototypeOf(engine)), engine);
        
        if (!coin.isSpawned && engine.diceValue === 6) {
            newEngine.spawnCoin(coinID);
            socket.emit('game-move', {
                roomId,
                to: { id: roomId },
                move: { type: 'SPAWN', coinID, baseID: myBase }
            });
        } else if (coin.isSpawned) {
            const diceAtStart = engine.diceValue;
            const success = newEngine.moveCoin(coinID);
            if (success) {
                socket.emit('game-move', {
                    roomId,
                    to: { id: roomId },
                    move: { type: 'MOVE', coinID, diceValue: diceAtStart, baseID: myBase }
                });
            }
        }
        
        setEngine(newEngine);
    };

    const myColor = useMemo(() => {
        if (!myBase) return '#64748b';
        switch(myBase) {
            case BaseID.BASE_1: return '#17669F';
            case BaseID.BASE_2: return '#088812';
            case BaseID.BASE_3: return '#D22E2E';
            case BaseID.BASE_4: return '#E3DE3B';
            default: return '#64748b';
        }
    }, [myBase]);

    return (
        <div className="ludo-container">
            {/* Status Bar */}
            <div className="flex justify-between w-full max-w-[600px] bg-slate-800 p-6 rounded-2xl text-white shadow-xl">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Your Color</span>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: myColor }} />
                        <span className="text-2xl font-black italic">{myBase?.replace('BASE_', 'PLAYER ')}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center bg-slate-900/50 px-6 py-2 rounded-xl border border-slate-700">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Current Turn</span>
                    <span className={`text-xl font-black ${engine.currentTurn === myBase ? 'text-green-400 animate-pulse' : 'text-white opacity-50'}`}>
                        {engine.currentTurn === myBase ? 'YOUR TURN' : engine.currentTurn.replace('BASE_', 'PLAYER ')}
                    </span>
                </div>

                <div className="flex items-center">
                    <Dice 
                        value={engine.diceValue} 
                        onRoll={handleRollDice} 
                        disabled={engine.currentTurn !== myBase || engine.isDiceRolled}
                        color={myColor}
                    />
                </div>
            </div>

            {/* The Board */}
            <Board engine={engine} onPawnClick={handlePawnClick} />

            {/* Victory Overlay */}
            {engine.winner && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="text-center p-12 bg-slate-900 rounded-[3rem] border border-orange-500/30 shadow-2xl scale-in-center">
                        <h2 className="text-7xl font-black text-white mb-2 tracking-tighter uppercase italic">
                            {engine.winner === myBase ? 'Victory!' : 'Defeat'}
                        </h2>
                        <p className="text-orange-500 font-bold mb-8 text-xl uppercase tracking-widest">
                            {engine.winner === myBase ? 'You dominated the board' : 'Next time for sure!'}
                        </p>
                        <Button 
                            onClick={() => {
                                const newEngine = new LudoEngine(playerCount);
                                setEngine(newEngine);
                                socket.emit('game-reset', { roomId, to: { id: roomId } });
                            }} 
                            className="h-16 px-12 rounded-2xl text-xl font-black bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                        >
                            PLAY AGAIN
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ludo;
