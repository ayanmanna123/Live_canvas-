import { PieceType, TeamType } from "../Constants";
import { Pawn } from "./Pawn";
import { Piece } from "./Piece";
import { Position } from "./Position";
import {
  getPossibleBishopMoves,
  getPossibleKingMoves,
  getPossibleKnightMoves,
  getPossiblePawnMoves,
  getPossibleQueenMoves,
  getPossibleRookMoves,
  getCastlingMoves,
} from "../rules/Rules";

export class Board {
  constructor(pieces, totalTurns) {
    this.pieces = pieces;
    this.totalTurns = totalTurns;
    this.winningTeam = undefined;
  }

  get currentTeam() {
    return this.totalTurns % 2 === 0 ? TeamType.OPPONENT : TeamType.OUR;
  }

  calculateAllMoves() {
    // Calculate the moves of all the pieces
    for (const piece of this.pieces) {
      piece.possibleMoves = this.getValidMoves(piece, this.pieces);
    }

    // Calculate castling moves
    for (const king of this.pieces.filter((p) => p.isKing)) {
      if (king.possibleMoves === undefined) continue;
      king.possibleMoves = [
        ...king.possibleMoves,
        ...getCastlingMoves(king, this.pieces),
      ];
    }

    // Check if the current team moves are valid
    this.checkCurrentTeamMoves();

    // Remove the possible moves for the team that is not playing
    for (const piece of this.pieces.filter((p) => p.team !== this.currentTeam)) {
      piece.possibleMoves = [];
    }

    // Check if the playing team still has moves left
    if (this.pieces.filter((p) => p.team === this.currentTeam).some((p) => p.possibleMoves !== undefined && p.possibleMoves.length > 0)) {
      return;
    }

    this.winningTeam = this.currentTeam === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR;
  }

  checkCurrentTeamMoves() {
    for (const piece of this.pieces.filter((p) => p.team === this.currentTeam)) {
      if (piece.possibleMoves === undefined) continue;

      for (const move of piece.possibleMoves) {
        const simulatedBoard = this.clone();
        simulatedBoard.pieces = simulatedBoard.pieces.filter((p) => !p.samePosition(move));
        const clonedPiece = simulatedBoard.pieces.find((p) => p.samePiecePosition(piece));
        clonedPiece.position = move.clone();

        const clonedKing = simulatedBoard.pieces.find((p) => p.isKing && p.team === simulatedBoard.currentTeam);
        if (!clonedKing) continue;

        for (const enemy of simulatedBoard.pieces.filter((p) => p.team !== simulatedBoard.currentTeam)) {
          enemy.possibleMoves = simulatedBoard.getValidMoves(enemy, simulatedBoard.pieces);

          if (enemy.isPawn) {
            if (enemy.possibleMoves.some((m) => m.x !== enemy.position.x && m.samePosition(clonedKing.position))) {
              piece.possibleMoves = piece.possibleMoves.filter((m) => !m.samePosition(move));
            }
          } else {
            if (enemy.possibleMoves.some((m) => m.samePosition(clonedKing.position))) {
              piece.possibleMoves = piece.possibleMoves.filter((m) => !m.samePosition(move));
            }
          }
        }
      }
    }
  }

  getValidMoves(piece, boardState) {
    switch (piece.type) {
      case PieceType.PAWN:
        return getPossiblePawnMoves(piece, boardState);
      case PieceType.KNIGHT:
        return getPossibleKnightMoves(piece, boardState);
      case PieceType.BISHOP:
        return getPossibleBishopMoves(piece, boardState);
      case PieceType.ROOK:
        return getPossibleRookMoves(piece, boardState);
      case PieceType.QUEEN:
        return getPossibleQueenMoves(piece, boardState);
      case PieceType.KING:
        return getPossibleKingMoves(piece, boardState);
      default:
        return [];
    }
  }

  playMove(enPassantMove, validMove, playedPiece, destination) {
    const pawnDirection = playedPiece.team === TeamType.OUR ? 1 : -1;
    const destinationPiece = this.pieces.find((p) => p.samePosition(destination));

    if (playedPiece.isKing && destinationPiece?.isRook && destinationPiece.team === playedPiece.team) {
      const direction = destinationPiece.position.x - playedPiece.position.x > 0 ? 1 : -1;
      const newKingXPosition = playedPiece.position.x + direction * 2;
      this.pieces = this.pieces.map((p) => {
        if (p.samePiecePosition(playedPiece)) {
          p.position.x = newKingXPosition;
        } else if (p.samePiecePosition(destinationPiece)) {
          p.position.x = newKingXPosition - direction;
        }
        return p;
      });
      this.calculateAllMoves();
      return true;
    }

    if (enPassantMove) {
      this.pieces = this.pieces.reduce((results, piece) => {
        if (piece.samePiecePosition(playedPiece)) {
          if (piece.isPawn) piece.enPassant = false;
          piece.position.x = destination.x;
          piece.position.y = destination.y;
          piece.hasMoved = true;
          results.push(piece);
        } else if (!piece.samePosition(new Position(destination.x, destination.y - pawnDirection))) {
          if (piece.isPawn) piece.enPassant = false;
          results.push(piece);
        }
        return results;
      }, []);
      this.calculateAllMoves();
    } else if (validMove) {
      this.pieces = this.pieces.reduce((results, piece) => {
        if (piece.samePiecePosition(playedPiece)) {
          if (piece.isPawn) piece.enPassant = Math.abs(playedPiece.position.y - destination.y) === 2;
          piece.position.x = destination.x;
          piece.position.y = destination.y;
          piece.hasMoved = true;
          results.push(piece);
        } else if (!piece.samePosition(destination)) {
          if (piece.isPawn) piece.enPassant = false;
          results.push(piece);
        }
        return results;
      }, []);
      this.calculateAllMoves();
    } else {
      return false;
    }
    return true;
  }

  clone() {
    return new Board(
      this.pieces.map((p) => p.clone()),
      this.totalTurns
    );
  }
}
