import { TeamType, PieceType } from "../Constants";
import { Position } from "../models/Position";
import { tileIsOccupied, tileIsOccupiedByOpponent, tileIsEmptyOrOccupiedByOpponent } from "./GeneralRules";

// PAWN
export const pawnMove = (initialPosition, desiredPosition, team, boardState) => {
  const specialRow = team === TeamType.OUR ? 1 : 6;
  const pawnDirection = team === TeamType.OUR ? 1 : -1;

  if (initialPosition.x === desiredPosition.x && initialPosition.y === specialRow && desiredPosition.y - initialPosition.y === 2 * pawnDirection) {
    return !tileIsOccupied(desiredPosition, boardState) && !tileIsOccupied(new Position(desiredPosition.x, desiredPosition.y - pawnDirection), boardState);
  } else if (initialPosition.x === desiredPosition.x && desiredPosition.y - initialPosition.y === pawnDirection) {
    return !tileIsOccupied(desiredPosition, boardState);
  } else if (Math.abs(desiredPosition.x - initialPosition.x) === 1 && desiredPosition.y - initialPosition.y === pawnDirection) {
    return tileIsOccupiedByOpponent(desiredPosition, boardState, team);
  }
  return false;
};

export const getPossiblePawnMoves = (pawn, boardState) => {
  const possibleMoves = [];
  const specialRow = pawn.team === TeamType.OUR ? 1 : 6;
  const pawnDirection = pawn.team === TeamType.OUR ? 1 : -1;

  const normalMove = new Position(pawn.position.x, pawn.position.y + pawnDirection);
  const specialMove = new Position(normalMove.x, normalMove.y + pawnDirection);
  const upperLeftAttack = new Position(pawn.position.x - 1, pawn.position.y + pawnDirection);
  const upperRightAttack = new Position(pawn.position.x + 1, pawn.position.y + pawnDirection);
  const leftPosition = new Position(pawn.position.x - 1, pawn.position.y);
  const rightPosition = new Position(pawn.position.x + 1, pawn.position.y);

  if (!tileIsOccupied(normalMove, boardState) && normalMove.y >= 0 && normalMove.y <= 7) {
    possibleMoves.push(normalMove);
    if (pawn.position.y === specialRow && !tileIsOccupied(specialMove, boardState)) {
      possibleMoves.push(specialMove);
    }
  }

  if (tileIsOccupiedByOpponent(upperLeftAttack, boardState, pawn.team)) {
    possibleMoves.push(upperLeftAttack);
  } else if (!tileIsOccupied(upperLeftAttack, boardState)) {
    const leftPiece = boardState.find((p) => p.samePosition(leftPosition));
    if (leftPiece != null && leftPiece.enPassant) {
      possibleMoves.push(upperLeftAttack);
    }
  }

  if (tileIsOccupiedByOpponent(upperRightAttack, boardState, pawn.team)) {
    possibleMoves.push(upperRightAttack);
  } else if (!tileIsOccupied(upperRightAttack, boardState)) {
    const rightPiece = boardState.find((p) => p.samePosition(rightPosition));
    if (rightPiece != null && rightPiece.enPassant) {
      possibleMoves.push(upperRightAttack);
    }
  }

  return possibleMoves;
};

// KNIGHT
export const knightMove = (initialPosition, desiredPosition, team, boardState) => {
  for (let i = -1; i < 2; i += 2) {
    for (let j = -1; j < 2; j += 2) {
      if (desiredPosition.y - initialPosition.y === 2 * i) {
        if (desiredPosition.x - initialPosition.x === j) {
          if (tileIsEmptyOrOccupiedByOpponent(desiredPosition, boardState, team)) return true;
        }
      }
      if (desiredPosition.x - initialPosition.x === 2 * i) {
        if (desiredPosition.y - initialPosition.y === j) {
          if (tileIsEmptyOrOccupiedByOpponent(desiredPosition, boardState, team)) return true;
        }
      }
    }
  }
  return false;
};

export const getPossibleKnightMoves = (knight, boardState) => {
  const possibleMoves = [];
  for (let i = -1; i < 2; i += 2) {
    for (let j = -1; j < 2; j += 2) {
      const verticalMove = new Position(knight.position.x + j, knight.position.y + i * 2);
      const horizontalMove = new Position(knight.position.x + i * 2, knight.position.y + j);

      if (verticalMove.x >= 0 && verticalMove.x <= 7 && verticalMove.y >= 0 && verticalMove.y <= 7) {
        if (tileIsEmptyOrOccupiedByOpponent(verticalMove, boardState, knight.team)) possibleMoves.push(verticalMove);
      }
      if (horizontalMove.x >= 0 && horizontalMove.x <= 7 && horizontalMove.y >= 0 && horizontalMove.y <= 7) {
        if (tileIsEmptyOrOccupiedByOpponent(horizontalMove, boardState, knight.team)) possibleMoves.push(horizontalMove);
      }
    }
  }
  return possibleMoves;
};

// BISHOP
export const bishopMove = (initialPosition, desiredPosition, team, boardState) => {
  for (let i = 1; i < 8; i++) {
    const multiplierX = desiredPosition.x < initialPosition.x ? -1 : 1;
    const multiplierY = desiredPosition.y < initialPosition.y ? -1 : 1;
    const passedPosition = new Position(initialPosition.x + i * multiplierX, initialPosition.y + i * multiplierY);

    if (passedPosition.samePosition(desiredPosition)) {
      if (tileIsEmptyOrOccupiedByOpponent(passedPosition, boardState, team)) return true;
    } else {
      if (tileIsOccupied(passedPosition, boardState)) break;
    }
  }
  return false;
};

export const getPossibleBishopMoves = (bishop, boardState) => {
  const possibleMoves = [];
  for (let i = 1; i < 8; i++) {
    const upperRight = new Position(bishop.position.x + i, bishop.position.y + i);
    if (upperRight.x < 8 && upperRight.y < 8) {
      if (!tileIsOccupied(upperRight, boardState)) possibleMoves.push(upperRight);
      else if (tileIsOccupiedByOpponent(upperRight, boardState, bishop.team)) {
        possibleMoves.push(upperRight);
        break;
      } else break;
    }
  }
  for (let i = 1; i < 8; i++) {
    const bottomRight = new Position(bishop.position.x + i, bishop.position.y - i);
    if (bottomRight.x < 8 && bottomRight.y >= 0) {
      if (!tileIsOccupied(bottomRight, boardState)) possibleMoves.push(bottomRight);
      else if (tileIsOccupiedByOpponent(bottomRight, boardState, bishop.team)) {
        possibleMoves.push(bottomRight);
        break;
      } else break;
    }
  }
  for (let i = 1; i < 8; i++) {
    const bottomLeft = new Position(bishop.position.x - i, bishop.position.y - i);
    if (bottomLeft.x >= 0 && bottomLeft.y >= 0) {
      if (!tileIsOccupied(bottomLeft, boardState)) possibleMoves.push(bottomLeft);
      else if (tileIsOccupiedByOpponent(bottomLeft, boardState, bishop.team)) {
        possibleMoves.push(bottomLeft);
        break;
      } else break;
    }
  }
  for (let i = 1; i < 8; i++) {
    const upperLeft = new Position(bishop.position.x - i, bishop.position.y + i);
    if (upperLeft.x >= 0 && upperLeft.y < 8) {
      if (!tileIsOccupied(upperLeft, boardState)) possibleMoves.push(upperLeft);
      else if (tileIsOccupiedByOpponent(upperLeft, boardState, bishop.team)) {
        possibleMoves.push(upperLeft);
        break;
      } else break;
    }
  }
  return possibleMoves;
};

// ROOK
export const rookMove = (initialPosition, desiredPosition, team, boardState) => {
  if (initialPosition.x === desiredPosition.x) {
    for (let i = 1; i < 8; i++) {
      const multiplier = desiredPosition.y < initialPosition.y ? -1 : 1;
      const passedPosition = new Position(initialPosition.x, initialPosition.y + i * multiplier);
      if (passedPosition.samePosition(desiredPosition)) {
        if (tileIsEmptyOrOccupiedByOpponent(passedPosition, boardState, team)) return true;
      } else {
        if (tileIsOccupied(passedPosition, boardState)) break;
      }
    }
  }
  if (initialPosition.y === desiredPosition.y) {
    for (let i = 1; i < 8; i++) {
      const multiplier = desiredPosition.x < initialPosition.x ? -1 : 1;
      const passedPosition = new Position(initialPosition.x + i * multiplier, initialPosition.y);
      if (passedPosition.samePosition(desiredPosition)) {
        if (tileIsEmptyOrOccupiedByOpponent(passedPosition, boardState, team)) return true;
      } else {
        if (tileIsOccupied(passedPosition, boardState)) break;
      }
    }
  }
  return false;
};

export const getPossibleRookMoves = (rook, boardState) => {
  const possibleMoves = [];
  // Top
  for (let i = 1; i < 8; i++) {
    const pos = new Position(rook.position.x, rook.position.y + i);
    if (pos.y > 7) break;
    if (!tileIsOccupied(pos, boardState)) possibleMoves.push(pos);
    else if (tileIsOccupiedByOpponent(pos, boardState, rook.team)) {
      possibleMoves.push(pos);
      break;
    } else break;
  }
  // Bottom
  for (let i = 1; i < 8; i++) {
    const pos = new Position(rook.position.x, rook.position.y - i);
    if (pos.y < 0) break;
    if (!tileIsOccupied(pos, boardState)) possibleMoves.push(pos);
    else if (tileIsOccupiedByOpponent(pos, boardState, rook.team)) {
      possibleMoves.push(pos);
      break;
    } else break;
  }
  // Left
  for (let i = 1; i < 8; i++) {
    const pos = new Position(rook.position.x - i, rook.position.y);
    if (pos.x < 0) break;
    if (!tileIsOccupied(pos, boardState)) possibleMoves.push(pos);
    else if (tileIsOccupiedByOpponent(pos, boardState, rook.team)) {
      possibleMoves.push(pos);
      break;
    } else break;
  }
  // Right
  for (let i = 1; i < 8; i++) {
    const pos = new Position(rook.position.x + i, rook.position.y);
    if (pos.x > 7) break;
    if (!tileIsOccupied(pos, boardState)) possibleMoves.push(pos);
    else if (tileIsOccupiedByOpponent(pos, boardState, rook.team)) {
      possibleMoves.push(pos);
      break;
    } else break;
  }
  return possibleMoves;
};

// QUEEN
export const queenMove = (initialPosition, desiredPosition, team, boardState) => {
  return bishopMove(initialPosition, desiredPosition, team, boardState) || rookMove(initialPosition, desiredPosition, team, boardState);
};

export const getPossibleQueenMoves = (queen, boardState) => {
  return [...getPossibleBishopMoves(queen, boardState), ...getPossibleRookMoves(queen, boardState)];
};

// KING
export const kingMove = (initialPosition, desiredPosition, team, boardState) => {
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      if (i === 0 && j === 0) continue;
      if (desiredPosition.x - initialPosition.x === i && desiredPosition.y - initialPosition.y === j) {
        if (tileIsEmptyOrOccupiedByOpponent(desiredPosition, boardState, team)) return true;
      }
    }
  }
  return false;
};

export const getPossibleKingMoves = (king, boardState) => {
  const possibleMoves = [];
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      if (i === 0 && j === 0) continue;
      const pos = new Position(king.position.x + i, king.position.y + j);
      if (pos.x >= 0 && pos.x <= 7 && pos.y >= 0 && pos.y <= 7) {
        if (tileIsEmptyOrOccupiedByOpponent(pos, boardState, king.team)) possibleMoves.push(pos);
      }
    }
  }
  return possibleMoves;
};

// CASTLING
export const getCastlingMoves = (king, boardState) => {
  const possibleMoves = [];
  if (king.hasMoved) return possibleMoves;

  const rooks = boardState.filter((p) => p.isRook && p.team === king.team && !p.hasMoved);

  for (const rook of rooks) {
    const direction = rook.position.x - king.position.x > 0 ? 1 : -1;
    const adjacentPosition = king.position.clone();
    adjacentPosition.x += direction;

    if (!tileIsOccupied(adjacentPosition, boardState) && !tileIsOccupied(new Position(adjacentPosition.x + direction, adjacentPosition.y), boardState)) {
      possibleMoves.push(rook.position.clone());
    }
  }

  return possibleMoves;
};
