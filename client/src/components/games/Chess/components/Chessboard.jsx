import React, { useRef, useState } from "react";
import "./Chessboard.css";
import Tile from "./Tile";
import {
  VERTICAL_AXIS,
  HORIZONTAL_AXIS,
  GRID_SIZE,
} from "../Constants";
import { Position } from "../models/Position";

export default function Chessboard({ playMove, pieces, myTeam }) {
  const [activePiece, setActivePiece] = useState(null);
  const [grabPosition, setGrabPosition] = useState(new Position(-1, -1));
  const chessboardRef = useRef(null);

  function grabPiece(e) {
    const element = e.target;
    const chessboard = chessboardRef.current;
    
    if (element.classList.contains("chess-piece") && chessboard) {
      const rect = chessboard.getBoundingClientRect();
      const grabX = Math.floor((e.clientX - rect.left) / (rect.width / 8));
      const grabY = 7 - Math.floor((e.clientY - rect.top) / (rect.height / 8));
      
      const piece = pieces.find(p => p.samePosition(new Position(grabX, grabY)));
      
      // Only allow grabbing our own pieces
      if (piece && piece.team === myTeam) {
        setGrabPosition(new Position(grabX, grabY));

        const x = e.clientX - (rect.width / 16);
        const y = e.clientY - (rect.height / 16);
        element.style.position = "absolute";
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        setActivePiece(element);
      }
    }
  }

  function movePiece(e) {
    const chessboard = chessboardRef.current;
    if (activePiece && chessboard) {
      const rect = chessboard.getBoundingClientRect();
      const x = e.clientX - (rect.width / 16);
      const y = e.clientY - (rect.height / 16);
      
      activePiece.style.position = "absolute";
      activePiece.style.left = `${x}px`;
      activePiece.style.top = `${y}px`;
    }
  }

  function dropPiece(e) {
    const chessboard = chessboardRef.current;
    if (activePiece && chessboard) {
      const rect = chessboard.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
      const y = 7 - Math.floor((e.clientY - rect.top) / (rect.height / 8));

      const currentPiece = pieces.find((p) => p.samePosition(grabPosition));

      if (currentPiece) {
        const success = playMove(currentPiece.clone(), new Position(x, y));

        if (!success) {
          activePiece.style.position = "relative";
          activePiece.style.removeProperty("top");
          activePiece.style.removeProperty("left");
        }
      }
      setActivePiece(null);
    }
  }

  let board = [];

  for (let j = 7; j >= 0; j--) {
    for (let i = 0; i < 8; i++) {
        const number = j + i + 2;
        const piece = pieces.find((p) => p.samePosition(new Position(i, j)));
        let image = piece ? piece.image : undefined;

        let currentPiece = activePiece != null ? pieces.find(p => p.samePosition(grabPosition)) : undefined;
        let highlight = currentPiece?.possibleMoves ? 
        currentPiece.possibleMoves.some(p => p.samePosition(new Position(i, j))) : false;

        board.push(<Tile key={`${j},${i}`} image={image} number={number} highlight={highlight} />);
    }
  }

  return (
    <div
      onMouseMove={(e) => movePiece(e)}
      onMouseDown={(e) => grabPiece(e)}
      onMouseUp={(e) => dropPiece(e)}
      id="chessboard"
      ref={chessboardRef}
      className="shadow-2xl rounded-lg overflow-hidden border-8 border-slate-800"
    >
      {board}
    </div>
  );
}
