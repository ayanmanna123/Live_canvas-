import mongoose from 'mongoose';

const userHistorySchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String, // socket.id
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date,
    default: null
  }
});

// Index for quickly finding the active session to update leftAt
userHistorySchema.index({ userId: 1, roomId: 1, leftAt: 1 });

const UserHistory = mongoose.model('UserHistory', userHistorySchema);

export default UserHistory;
