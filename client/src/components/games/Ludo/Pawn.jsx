import React from 'react';
import { TeamType } from './Constants';
import './Ludo.css';

const Pawn = ({ coin, onClick, isMovable }) => {
    const getColor = (color) => {
        switch(color) {
            case TeamType.BLUE: return 'pawn-blue';
            case TeamType.GREEN: return 'pawn-green';
            case TeamType.RED: return 'pawn-red';
            case TeamType.YELLOW: return 'pawn-yellow';
            default: return '';
        }
    };

    return (
        <div 
            className={`ludo-pawn ${getColor(coin.color)} ${isMovable ? 'movable scale-110 shadow-lg' : ''}`}
            onClick={() => isMovable && onClick(coin.coinID)}
            title={coin.coinID}
        />
    );
};

export default Pawn;
