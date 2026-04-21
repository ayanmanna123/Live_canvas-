import { BaseID, CellType, WINNING_MOVES } from './Constants';
import { INITIAL_GAME_DATA } from './BoardData';

export class LudoEngine {
    constructor(playerCount = 4) {
        this.playerCount = playerCount;
        this.reset();
    }

    reset() {
        this.bases = JSON.parse(JSON.stringify(INITIAL_GAME_DATA.bases));
        this.coins = {};
        
        // Initialize 16 coins
        Object.keys(this.bases).forEach(baseID => {
            const base = this.bases[baseID];
            base.coinIDs.forEach(coinID => {
                this.coins[coinID] = {
                    coinID,
                    baseID,
                    isSpawned: false,
                    isRetired: false,
                    steps: 0,
                    cellID: null,
                    position: null,
                    color: base.color
                };
            });
        });

        // Set enabled bases based on player count
        // 2 players: BASE_1 (Blue) and BASE_4 (Yellow) - usually opposite
        // 3 players: BASE_1, BASE_2 (Green), BASE_4
        // 4 players: All
        this.enableBases();

        this.currentTurn = BaseID.BASE_1; // Blue starts
        this.diceValue = 0;
        this.isDiceRolled = false;
        this.winner = null;
    }

    enableBases() {
        Object.keys(this.bases).forEach(id => this.bases[id].enabled = false);
        if (this.playerCount === 2) {
            this.bases[BaseID.BASE_1].enabled = true;
            this.bases[BaseID.BASE_4].enabled = true;
            // Adjust nextTurn for 2 players
            this.bases[BaseID.BASE_1].nextTurn = BaseID.BASE_4;
            this.bases[BaseID.BASE_4].nextTurn = BaseID.BASE_1;
        } else if (this.playerCount === 3) {
            this.bases[BaseID.BASE_1].enabled = true;
            this.bases[BaseID.BASE_2].enabled = true;
            this.bases[BaseID.BASE_4].enabled = true;
            this.bases[BaseID.BASE_1].nextTurn = BaseID.BASE_2;
            this.bases[BaseID.BASE_2].nextTurn = BaseID.BASE_4;
            this.bases[BaseID.BASE_4].nextTurn = BaseID.BASE_1;
        } else {
            Object.keys(this.bases).forEach(id => this.bases[id].enabled = true);
        }
    }

    rollDice() {
        if (this.isDiceRolled) return null;
        this.diceValue = Math.floor(Math.random() * 6) + 1;
        this.isDiceRolled = true;
        
        // Check if any move is possible
        const movableCoins = this.getMovableCoins();
        if (movableCoins.length === 0) {
            // Auto skip if no move possible
            return { diceValue: this.diceValue, noMoves: true };
        }
        return { diceValue: this.diceValue, noMoves: false };
    }

    getMovableCoins() {
        const base = this.bases[this.currentTurn];
        return base.coinIDs.filter(coinID => {
            const coin = this.coins[coinID];
            if (coin.isRetired) return false;
            if (!coin.isSpawned && this.diceValue !== 6) return false;
            if (coin.steps + this.diceValue > WINNING_MOVES) return false;
            return true;
        });
    }

    spawnCoin(coinID) {
        const coin = this.coins[coinID];
        if (!coin || coin.isSpawned || this.diceValue !== 6) return false;

        const walkway = INITIAL_GAME_DATA.walkways.find(w => w.baseID === coin.baseID);
        const spawnCell = Object.values(INITIAL_GAME_DATA.cells[walkway.position]).find(c => c.type === CellType.SPAWN);

        coin.isSpawned = true;
        coin.cellID = spawnCell.cellID;
        coin.position = walkway.position;
        coin.steps = 1;

        this.isDiceRolled = false;
        // Rolling a 6 gives another turn, so we don't switch turn
        return true;
    }

    moveCoin(coinID) {
        const coin = this.coins[coinID];
        if (!coin || !coin.isSpawned || this.isDiceRolled === false) return false;
        if (coin.steps + this.diceValue > WINNING_MOVES) return false;

        let currentCellID = coin.cellID;
        let currentPos = coin.position;
        const steps = this.diceValue;

        // Animate or just calculate end position?
        // Let's calculate end position and check for kills
        for (let i = 0; i < steps; i++) {
            const nextLink = this.getNextCell(currentCellID, currentPos, coin.baseID);
            if (!nextLink) break;
            currentCellID = nextLink.cellID;
            currentPos = nextLink.position;
        }

        coin.cellID = currentCellID;
        coin.position = currentPos;
        coin.steps += steps;

        if (currentCellID === 'HOME') {
            coin.isRetired = true;
            this.checkWin(coin.baseID);
        } else {
            this.handleKillLogic(coinID);
        }

        const bonusTurn = this.diceValue === 6 || currentCellID === 'HOME';
        this.nextTurn(bonusTurn);
        
        return true;
    }

    getNextCell(cellID, position, baseID) {
        const links = INITIAL_GAME_DATA.links[cellID];
        if (!links) return null;
        if (links.length === 1) return links[0];
        
        // Handle branching (entering home path)
        return links.find(l => {
            const cell = INITIAL_GAME_DATA.cells[l.position]?.[l.cellID];
            return cell?.type === CellType.HOMEPATH && cell.baseID === baseID;
        }) || links[0];
    }

    handleKillLogic(activeCoinID) {
        const activeCoin = this.coins[activeCoinID];
        const cell = INITIAL_GAME_DATA.cells[activeCoin.position][activeCoin.cellID];
        
        if (cell.type === CellType.NORMAL) {
            // Check other coins in the same spot
            Object.values(this.coins).forEach(otherCoin => {
                if (otherCoin.coinID !== activeCoinID && 
                    otherCoin.cellID === activeCoin.cellID && 
                    otherCoin.position === activeCoin.position &&
                    otherCoin.baseID !== activeCoin.baseID &&
                    !otherCoin.isRetired) {
                    
                    // Kill!
                    otherCoin.isSpawned = false;
                    otherCoin.cellID = null;
                    otherCoin.position = null;
                    otherCoin.steps = 0;
                }
            });
        }
    }

    nextTurn(bonus = false) {
        this.isDiceRolled = false;
        if (bonus) return;
        this.currentTurn = this.bases[this.currentTurn].nextTurn;
        
        // Skip winners or disabled bases
        while (!this.bases[this.currentTurn].enabled || this.bases[this.currentTurn].hasWon) {
            this.currentTurn = this.bases[this.currentTurn].nextTurn;
        }
    }

    checkWin(baseID) {
        const base = this.bases[baseID];
        const allHome = base.coinIDs.every(id => this.coins[id].isRetired);
        if (allHome) {
            base.hasWon = true;
            this.winner = baseID;
        }
    }
}
