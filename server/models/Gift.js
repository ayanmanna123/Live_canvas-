import mongoose from 'mongoose';

const GiftSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  receiverId: { type: String }, 
  content: {
    message: { type: String },
    imageUrl: { type: String },
    imageUrls: [{ type: String }],
    drawingUrl: { type: String } // Keeping for legacy/compatibility
  },
  contentType: { type: String, enum: ['drawing', 'message', 'picture', 'capsule'], required: true },
  unlockDate: { type: Date, required: true },
  isOpened: { type: Boolean, default: false },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Gift', GiftSchema);
