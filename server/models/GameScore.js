import mongoose from 'mongoose';

const gameScoreSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    index: true
  },
  player1: {
    type: String, // userName
    required: true,
    index: true
  },
  player2: {
    type: String, // userName
    required: true,
    index: true
  },
  score1: {
    type: Number,
    default: 0
  },
  score2: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure unique entry for any pair of players in a specific game
// We will always sort player1 and player2 alphabetically before saving
gameScoreSchema.index({ gameId: 1, player1: 1, player2: 1 }, { unique: true });

const GameScore = mongoose.model('GameScore', gameScoreSchema);

export default GameScore;
