import mongoose from 'mongoose';

const strokeSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'freehand'
  },
  content: {
    type: String,
    default: ''
  },
  points: [
    {
      x: Number,
      y: Number
    }
  ],
  color: {
    type: String,
    default: '#ffffff'
  },
  size: {
    type: Number,
    default: 5
  },
  tool: {
    type: String,
    default: 'pencil'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 * 7 // Optional: Auto-delete strokes after 7 days
  }
});

const Stroke = mongoose.model('Stroke', strokeSchema);

export default Stroke;
