import React from 'react';
import './Ludo.css';

const CONFIGURATIONS = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [1, 0, 0, 0, 0, 0, 0, 0, 1],
  3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 1, 1, 0, 0, 0, 1, 1, 1],
};

const Dice = ({ value, onRoll, disabled, color }) => {
    const dots = CONFIGURATIONS[value] || [0, 0, 0, 0, 0, 0, 0, 0, 0];

    return (
        <div className="flex flex-col items-center gap-3">
            <div 
                className={`ludo-dice ${disabled ? 'disabled' : ''} shadow-inner bg-white active:scale-95 transition-transform`}
                onClick={() => !disabled && onRoll()}
                style={{ border: `4px solid ${color || '#64748b'}` }}
            >
                {dots.map((dot, i) => (
                    <div key={i} className={`dice-dot ${dot ? 'opacity-100' : 'opacity-0'}`} />
                ))}
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                {disabled ? 'Wait...' : 'Roll Dice'}
            </span>
        </div>
    );
};

export default Dice;
