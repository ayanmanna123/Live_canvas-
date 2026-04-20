import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String, // socket.id or persistent ID
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  subscription: {
    endpoint: { type: String, required: true },
    expirationTime: { type: Number },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 * 30 // Clear old subscriptions after 30 days
  }
});

// Ensure unique subscriptions per user in room
pushSubscriptionSchema.index({ roomId: 1, userId: 1 }, { unique: true });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;
