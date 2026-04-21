import React from 'react';
import { BaseID, CellType, WalkwayPosition, TeamType } from './Constants';
import { INITIAL_GAME_DATA } from './BoardData';
import Pawn from './Pawn';
import './Ludo.css';

const Board = ({ engine, onPawnClick }) => {
    const renderBase = (baseID, color, gridArea) => {
        const base = engine.bases[baseID];
        const colorClass = `base-${color.toLowerCase()}`;
        return (
            <div className={`ludo-base ${colorClass}`} style={{ gridArea }}>
                {base.coinIDs.map(coinID => {
                    const coin = engine.coins[coinID];
                    return (
                        <div key={coinID} className="base-inner relative">
                            {!coin.isSpawned && !coin.isRetired && (
                                <Pawn 
                                    coin={coin} 
                                    onClick={onPawnClick} 
                                    isMovable={engine.currentTurn === baseID && engine.isDiceRolled && engine.diceValue === 6} 
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWalkway = (position, gridArea) => {
        const cells = INITIAL_GAME_DATA.cells[position];
        return (
            <div style={{ gridArea, display: 'grid', 
                gridTemplateColumns: position === WalkwayPosition.NORTH || position === WalkwayPosition.SOUTH ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
                gridTemplateRows: position === WalkwayPosition.NORTH || position === WalkwayPosition.SOUTH ? 'repeat(6, 1fr)' : 'repeat(3, 1fr)'
            }}>
                {Object.values(cells).sort((a,b) => {
                    // Sort to match grid order
                    if (position === WalkwayPosition.NORTH || position === WalkwayPosition.SOUTH) {
                        return a.row * 3 + a.col - (b.row * 3 + b.col);
                    } else {
                        return a.row * 6 + a.col - (b.row * 6 + b.col);
                    }
                }).map(cell => {
                    let cellClass = 'ludo-cell';
                    if (cell.type === CellType.SPAWN) cellClass += ` cell-spawn-${cell.baseID === BaseID.BASE_1 ? 'blue' : cell.baseID === BaseID.BASE_2 ? 'green' : cell.baseID === BaseID.BASE_3 ? 'red' : 'yellow'}`;
                    if (cell.type === CellType.HOMEPATH) cellClass += ` cell-homepath-${cell.baseID === BaseID.BASE_1 ? 'blue' : cell.baseID === BaseID.BASE_2 ? 'green' : cell.baseID === BaseID.BASE_3 ? 'red' : 'yellow'}`;
                    if (cell.type === CellType.STAR) cellClass += ' cell-star';

                    // Find coins on this cell
                    const coinsOnCell = Object.values(engine.coins).filter(c => c.cellID === cell.cellID && c.position === position);

                    return (
                        <div key={cell.cellID} className={cellClass}>
                            {coinsOnCell.map((coin, idx) => (
                                <Pawn 
                                    key={coin.coinID} 
                                    coin={coin} 
                                    onClick={onPawnClick}
                                    isMovable={engine.currentTurn === coin.baseID && engine.isDiceRolled && (coin.steps + engine.diceValue <= 56)}
                                    // Offset multiple pawns
                                    style={{ transform: `translate(${idx * 5}px, ${idx * 5}px)` }}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="ludo-board">
            {/* Top Row */}
            {renderBase(BaseID.BASE_2, TeamType.GREEN, "1 / 1 / 7 / 7")}
            {renderWalkway(WalkwayPosition.NORTH, "1 / 7 / 7 / 10")}
            {renderBase(BaseID.BASE_4, TeamType.YELLOW, "1 / 10 / 7 / 16")}

            {/* Middle Row */}
            {renderWalkway(WalkwayPosition.WEST, "7 / 1 / 10 / 7")}
            <div className="ludo-home">HOME</div>
            {renderWalkway(WalkwayPosition.EAST, "7 / 10 / 10 / 16")}

            {/* Bottom Row */}
            {renderBase(BaseID.BASE_1, TeamType.BLUE, "10 / 1 / 16 / 7")}
            {renderWalkway(WalkwayPosition.SOUTH, "10 / 7 / 16 / 10")}
            {renderBase(BaseID.BASE_3, TeamType.RED, "10 / 10 / 16 / 16")}
        </div>
    );
};

export default Board;
