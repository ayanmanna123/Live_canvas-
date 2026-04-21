import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import Chessboard from './components/Chessboard';
import { getInitialBoard } from './initialBoard';
import { Position } from './models/Position';
import { Piece } from './models/Piece';
import { TeamType, PieceType } from './Constants';
import './components/Chessboard.css';

const Chess = () => {
    const location = useLocation();
    const { socket, isConnected } = useSocket();
    const { roomId, userName, opponent, isInviter } = location.state || {};

    const [board, setBoard] = useState(getInitialBoard());
    const [promotionPawn, setPromotionPawn] = useState(null);
    const [gameWinner, setGameWinner] = useState(null);

    // Inviter is White (OUR), Opponent is Black (OPPONENT)
    const myTeam = isInviter ? TeamType.OUR : TeamType.OPPONENT;
    const isMyTurn = (board.totalTurns % 2 === 1 && myTeam === TeamType.OUR) || 
                     (board.totalTurns % 2 === 0 && myTeam === TeamType.OPPONENT);

    const playMove = useCallback((playedPiece, destination, isRemote = false, promotionType = null) => {
        if (!isRemote && !isMyTurn) return false;
        if (gameWinner) return false;

        const enPassantMove = isEnPassantMove(playedPiece, destination);

        // Valid move check (already checked in Chessboard but good to double check)
        const validMove = playedPiece.possibleMoves?.some((m) => m.samePosition(destination));
        if (!validMove) return false;

        let moveResult = false;
        
        setBoard((prevBoard) => {
            const clonedBoard = prevBoard.clone();
            clonedBoard.totalTurns += 1;
            
            moveResult = clonedBoard.playMove(
                enPassantMove,
                validMove,
                playedPiece,
                destination
            );

            if (clonedBoard.winningTeam !== undefined) {
                setGameWinner(clonedBoard.winningTeam);
            }

            return clonedBoard;
        });

        // Handle Promotion
        let promotionRow = playedPiece.team === TeamType.OUR ? 7 : 0;
        if (destination.y === promotionRow && playedPiece.isPawn) {
            if (isRemote && promotionType) {
                completePromotion(promotionType, destination, playedPiece.team);
            } else if (!isRemote) {
                setPromotionPawn({ piece: playedPiece, destination });
            }
        }

        // Emit move to socket
        if (!isRemote && socket) {
            socket.emit('game-move', {
                roomId,
                to: opponent,
                move: {
                    type: 'CHESS_MOVE',
                    playedPiece: {
                        position: playedPiece.position,
                        type: playedPiece.type,
                        team: playedPiece.team
                    },
                    destination,
                    promotionType // Will be null here, handled in completePromotion for local
                }
            });
        }

        return moveResult;
    }, [isMyTurn, gameWinner, board, socket, roomId, opponent]);

    const isEnPassantMove = (playedPiece, destination) => {
        const pawnDirection = playedPiece.team === TeamType.OUR ? 1 : -1;
        if (playedPiece.isPawn) {
            if (Math.abs(destination.x - playedPiece.position.x) === 1 && destination.y - playedPiece.position.y === pawnDirection) {
                const piece = board.pieces.find(p => 
                    p.position.x === destination.x && 
                    p.position.y === destination.y - pawnDirection && 
                    p.isPawn && p.enPassant
                );
                return !!piece;
            }
        }
        return false;
    };

    const completePromotion = (pieceType, destination, team) => {
        setBoard((prevBoard) => {
            const clonedBoard = prevBoard.clone();
            clonedBoard.pieces = clonedBoard.pieces.reduce((results, piece) => {
                if (piece.position.samePosition(destination)) {
                    results.push(new Piece(piece.position.clone(), pieceType, team, true));
                } else {
                    results.push(piece);
                }
                return results;
            }, []);
            clonedBoard.calculateAllMoves();
            return clonedBoard;
        });
        setPromotionPawn(null);

        // If local promotion, emit it
        if (promotionPawn && socket) {
            socket.emit('game-move', {
                roomId,
                to: opponent,
                move: {
                    type: 'CHESS_PROMOTION',
                    pieceType,
                    destination,
                    team
                }
            });
        }
    };

    const handleReset = (isLocal = true) => {
        setBoard(getInitialBoard());
        setGameWinner(null);
        setPromotionPawn(null);
        if (isLocal && socket) {
            socket.emit('game-reset', { roomId, to: opponent });
        }
    };

    useEffect(() => {
        if (socket && isConnected) {
            socket.on('receive-game-move', (data) => {
                if (data.type === 'CHESS_MOVE') {
                    const { playedPiece, destination } = data;
                    // Reconstruct piece object
                    const piece = board.pieces.find(p => 
                        p.position.x === playedPiece.position.x && 
                        p.position.y === playedPiece.position.y
                    );
                    if (piece) {
                        playMove(piece, new Position(destination.x, destination.y), true);
                    }
                } else if (data.type === 'CHESS_PROMOTION') {
                    const { pieceType, destination, team } = data;
                    completePromotion(pieceType, new Position(destination.x, destination.y), team);
                }
            });

            socket.on('receive-game-reset', () => {
                handleReset(false);
            });

            return () => {
                socket.off('receive-game-move');
                socket.off('receive-game-reset');
            };
        }
    }, [socket, isConnected, board, playMove]);

    return (
        <div className="flex flex-col items-center gap-8 p-4">
            <div className="flex justify-between w-full max-w-[600px] bg-slate-800 p-6 rounded-2xl text-white shadow-xl">
                <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase font-black text-slate-400">Your Team</span>
                    <span className="text-2xl font-black">{myTeam === TeamType.OUR ? 'WHITE' : 'BLACK'}</span>
                </div>
                <div className={`flex flex-col items-center p-3 rounded-xl transition-all ${isMyTurn ? 'bg-emerald-500 scale-105' : 'bg-slate-700 opacity-50'}`}>
                    <span className="text-[10px] uppercase font-black">Current Turn</span>
                    <span className="font-bold">{isMyTurn ? 'YOUR TURN' : 'WAITING...'}</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                    <span className="text-xs uppercase font-black text-slate-400">Opponent</span>
                    <span className="text-2xl font-black">{opponent?.name || 'Unknown'}</span>
                </div>
            </div>

            <Chessboard 
                playMove={playMove} 
                pieces={board.pieces} 
                myTeam={myTeam}
            />

            {promotionPawn && (
                <div className="promotion-modal">
                    <div className="promotion-modal-content shadow-2xl animate-in zoom-in duration-300">
                        {[PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT, PieceType.QUEEN].map(type => (
                            <img 
                                key={type}
                                src={`/assets/images/chess/${type}_${myTeam}.png`}
                                className="promotion-option"
                                onClick={() => completePromotion(type, promotionPawn.destination, myTeam)}
                                alt={type}
                            />
                        ))}
                    </div>
                </div>
            )}

            {gameWinner && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl max-w-sm border-4 border-slate-800">
                        <div className="text-6xl mb-6">🏆</div>
                        <h2 className="text-4xl font-black mb-4 uppercase">
                            {gameWinner === myTeam ? 'VICTORY!' : 'DEFEAT'}
                        </h2>
                        <p className="text-slate-500 mb-8 font-medium">
                            {gameWinner === myTeam ? 'You have checkmated your opponent!' : 'Your king has fallen!'}
                        </p>
                        <button 
                            className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                            onClick={() => handleReset()}
                        >
                            REMATCH
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chess;
