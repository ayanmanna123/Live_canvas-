import mongoose from 'mongoose';

const MemorySchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['capture', 'gift'],
    default: 'capture'
  },
  contentType: {
    type: String,
    enum: ['image', 'message'],
    default: 'image'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Memory', MemorySchema);
