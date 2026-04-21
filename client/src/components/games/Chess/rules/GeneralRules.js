export const tileIsOccupied = (position, boardState) => {
  return boardState.find((p) => p.samePosition(position)) !== undefined;
};

export const tileIsOccupiedByOpponent = (position, boardState, team) => {
  return boardState.find((p) => p.samePosition(position) && p.team !== team) !== undefined;
};

export const tileIsEmptyOrOccupiedByOpponent = (position, boardState, team) => {
  return !tileIsOccupied(position, boardState) || tileIsOccupiedByOpponent(position, boardState, team);
};
