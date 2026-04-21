import { Board } from "./models/Board";
import { Piece } from "./models/Piece";
import { Pawn } from "./models/Pawn";
import { Position } from "./models/Position";
import { PieceType, TeamType } from "./Constants";

export const getInitialBoard = () => {
  const pieces = [
    new Piece(new Position(0, 7), PieceType.ROOK, TeamType.OPPONENT, false),
    new Piece(new Position(1, 7), PieceType.KNIGHT, TeamType.OPPONENT, false),
    new Piece(new Position(2, 7), PieceType.BISHOP, TeamType.OPPONENT, false),
    new Piece(new Position(3, 7), PieceType.QUEEN, TeamType.OPPONENT, false),
    new Piece(new Position(4, 7), PieceType.KING, TeamType.OPPONENT, false),
    new Piece(new Position(5, 7), PieceType.BISHOP, TeamType.OPPONENT, false),
    new Piece(new Position(6, 7), PieceType.KNIGHT, TeamType.OPPONENT, false),
    new Piece(new Position(7, 7), PieceType.ROOK, TeamType.OPPONENT, false),
    new Pawn(new Position(0, 6), TeamType.OPPONENT, false, false),
    new Pawn(new Position(1, 6), TeamType.OPPONENT, false, false),
    new Pawn(new Position(2, 6), TeamType.OPPONENT, false, false),
    new Pawn(new Position(3, 6), TeamType.OPPONENT, false, false),
    new Pawn(new Position(4, 6), TeamType.OPPONENT, false, false),
    new Pawn(new Position(5, 6), TeamType.OPPONENT, false, false),
    new Pawn(new Position(6, 6), TeamType.OPPONENT, false, false),
    new Pawn(new Position(7, 6), TeamType.OPPONENT, false, false),

    new Piece(new Position(0, 0), PieceType.ROOK, TeamType.OUR, false),
    new Piece(new Position(1, 0), PieceType.KNIGHT, TeamType.OUR, false),
    new Piece(new Position(2, 0), PieceType.BISHOP, TeamType.OUR, false),
    new Piece(new Position(3, 0), PieceType.QUEEN, TeamType.OUR, false),
    new Piece(new Position(4, 0), PieceType.KING, TeamType.OUR, false),
    new Piece(new Position(5, 0), PieceType.BISHOP, TeamType.OUR, false),
    new Piece(new Position(6, 0), PieceType.KNIGHT, TeamType.OUR, false),
    new Piece(new Position(7, 0), PieceType.ROOK, TeamType.OUR, false),
    new Pawn(new Position(0, 1), TeamType.OUR, false, false),
    new Pawn(new Position(1, 1), TeamType.OUR, false, false),
    new Pawn(new Position(2, 1), TeamType.OUR, false, false),
    new Pawn(new Position(3, 1), TeamType.OUR, false, false),
    new Pawn(new Position(4, 1), TeamType.OUR, false, false),
    new Pawn(new Position(5, 1), TeamType.OUR, false, false),
    new Pawn(new Position(6, 1), TeamType.OUR, false, false),
    new Pawn(new Position(7, 1), TeamType.OUR, false, false),
  ];

  const board = new Board(pieces, 1);
  board.calculateAllMoves();
  return board;
};
