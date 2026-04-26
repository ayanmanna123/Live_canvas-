import mongoose from 'mongoose';

const musicTrackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  url: { type: String, required: true },
  thumbnail: { type: String },
  uploadedBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Create a text index for search
musicTrackSchema.index({ title: 'text', artist: 'text' });

const MusicTrack = mongoose.model('MusicTrack', musicTrackSchema);

export default MusicTrack;
