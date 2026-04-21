import React from 'react';

const Tile = ({ image, number, highlight }) => {
  const className = [
    "chess-tile",
    number % 2 === 0 ? "tile-black" : "tile-white",
    highlight && "tile-highlight",
    image && "chess-piece-tile"
  ].filter(Boolean).join(" ");

  return (
    <div className={className}>
      {image && (
        <div 
          style={{ backgroundImage: `url(${image})` }} 
          className="chess-piece"
        />
      )}
    </div>
  );
};

export default Tile;
