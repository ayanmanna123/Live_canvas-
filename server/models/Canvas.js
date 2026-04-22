import mongoose from 'mongoose';

const canvasSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  bgColor: {
    type: String,
    default: '#0f172a'
  },
  createdBy: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Canvas = mongoose.model('Canvas', canvasSchema);
export default Canvas;
