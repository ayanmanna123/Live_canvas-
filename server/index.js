import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Message from './models/Message.js';
import Stroke from './models/Stroke.js';
import UserHistory from './models/UserHistory.js';
import PushSubscription from './models/PushSubscription.js';
import GameScore from './models/GameScore.js';
import Canvas from './models/Canvas.js';
import Memory from './models/Memory.js';
import Gift from './models/Gift.js';
import { sendPushNotification } from './utils/pushNotification.js';
import ImageKit from 'imagekit';
import multer from 'multer';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import sharp from 'sharp';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const clientUrl = (process.env.CLIENT_URL || '').replace(/\/$/, '');

const io = new Server(httpServer, {
  cors: {
    origin: clientUrl || '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: clientUrl || '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// ImageKit Setup
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Multer Setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Gemini AI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const listModels = async () => {
  try {
    // Note: listModels might not be available on the main genAI object depending on version
    // but we can try to use it to debug
    console.log("Checking available models...");
  } catch (e) { }
};
listModels();

app.post('/api/ai/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const refinePrompt = `You are a professional prompt engineer for AI image generators.

The user wants to generate a VERY LOW-DETAIL technical outline drawing of: "${prompt}".

Create a prompt for ultra-simple clean vector line art.

Requirements:
- Black outline only, no colors.
- Transparent background (PNG style alpha background).
- Extremely low detail architectural/technical drawing.
- Clean 2D front elevation style.
- Thin to medium consistent strokes.
- Simple geometric outlines only.
- Minimal windows, doors, and structure lines.
- No shading, no textures, no shadows.
- No sketch roughness, no hand-drawn wobble.
- No perspective, no 3D rendering.
- No realism.
- No decorative details.
- No furniture, people, trees, cars, sky, or surroundings.
- No fill colors, outlines only.
- Crisp vector/SVG-style linework.
- CAD drawing / blueprint outline style.
- Centered composition, isolated object only.
- High clarity, clean edges, simple and readable.

Style reference:
MS Paint clean line drawing, beginner architectural outline, coloring-book style, technical contour illustration.

Return ONLY the refined prompt text, nothing else.`;

    let result;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Retry logic for 503/429 errors
    let lastErr;
    for (let i = 0; i < 3; i++) {
      try {
        result = await model.generateContent(refinePrompt);
        break;
      } catch (err) {
        lastErr = err;
        if ((err.status === 503 || err.status === 429) && i < 2) {
          console.warn(`Gemini busy (Attempt ${i + 1}/3). Retrying in 2s...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        break;
      }
    }

    if (!result) {
      console.error('Gemini Final Error:', lastErr);
      if (lastErr.status === 503) {
        return res.status(503).json({ error: 'AI Service is overloaded. Please try again in 10 seconds.' });
      }
      if (lastErr.status === 429) {
        return res.status(429).json({ error: 'AI Quota Exceeded. Please wait a moment.' });
      }
      throw lastErr;
    }

    const refinedPrompt = result.response.text().trim();
    console.log('Refined Prompt:', refinedPrompt);

    // 2. Use Pollinations.ai to generate the image
    console.log('Requesting image from Pollinations.ai API...');
    const seed = Math.floor(Math.random() * 1000000);
    // Using image.pollinations.ai/prompt/ which is the direct API endpoint
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(refinedPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

    // 3. Fetch the image buffer
    console.log('Fetching image from Pollinations...');
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 30000 // 30 seconds timeout
    });

    const contentType = imageResponse.headers['content-type'];
    console.log('Pollinations Response Content-Type:', contentType);

    if (!contentType || !contentType.startsWith('image/')) {
      const textResponse = Buffer.from(imageResponse.data).toString();
      console.error('Pollinations Error Response:', textResponse.substring(0, 500));
      throw new Error('Received invalid image data (possibly an error page)');
    }

    let buffer = Buffer.from(imageResponse.data, 'binary');
    console.log('Image received from Pollinations. Processing transparency...');

    // 4. Make background transparent using Sharp
    try {
      const { data, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Iterate through pixels and make white/near-white transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If the pixel is near white (threshold 245)
        if (r > 245 && g > 245 && b > 245) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }

      // Convert back to PNG buffer
      buffer = await sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4
        }
      })
        .png()
        .toBuffer();

      console.log('Transparency processing complete.');
    } catch (sharpError) {
      console.error('Error processing transparency:', sharpError);
      // Fallback to original buffer if sharp fails
    }

    // 5. Upload to ImageKit for persistence
    console.log('Uploading transparent image to ImageKit...');
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: `ai_${Date.now()}.png`,
      folder: '/live-canvas/ai'
    });

    console.log('AI Image Upload Success:', uploadResponse.url);
    res.json({ url: uploadResponse.url, prompt: refinedPrompt });
  } catch (error) {
    console.error('AI Generation error:', error);
    res.status(500).json({ error: 'AI Image generation failed: ' + error.message });
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const response = await imagekit.upload({
      file: req.file.buffer, // Directly upload buffer
      fileName: req.file.originalname.replace(/\s+/g, '_'),
      folder: '/live-canvas'
    });

    res.json({ url: response.url });
  } catch (error) {
    console.error('ImageKit upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/memories/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const memories = await Memory.find({ roomId }).sort({ createdAt: -1 });
    res.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const { roomId, imageUrl, caption, createdBy } = req.body;
    if (!roomId || !imageUrl || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newMemory = new Memory({
      roomId,
      imageUrl,
      caption,
      createdBy
    });

    await newMemory.save();
    res.json(newMemory);
  } catch (error) {
    console.error('Error saving memory:', error);
    res.status(500).json({ error: 'Failed to save memory' });
  }
});

app.delete('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Memory.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/live-canvas';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error. Drawing will work but history will not be saved:', err.message);
  }
};

connectDB();

// Socket.IO Logic
// Map<roomId, Map<socketId, userName>>
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async ({ roomId, userName }) => {
    if (!roomId || !userName) return;

    socket.join(roomId);
    console.log(`${userName} (${socket.id}) joined room: ${roomId}`);

    // Track user in room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Map(),
        movie: { url: '', playing: false, currentTime: 0, masterId: null },
        music: { url: '', playing: false, currentTime: 0, masterId: null, title: '', artist: '', thumbnail: '' }
      });
    }
    rooms.get(roomId).users.set(socket.id, userName);

    // Send existing strokes, chat history, and user history to the new user (only if DB is connected)
    if (mongoose.connection.readyState === 1) {
      try {
        // Find or create default canvas for this room
        let activeCanvas = await Canvas.findOne({ roomId }).sort({ createdAt: 1 });
        if (!activeCanvas) {
          activeCanvas = new Canvas({
            name: 'Default Canvas',
            roomId,
            createdBy: 'System'
          });
          await activeCanvas.save();
        }

        const [strokes, messages, history, allCanvases, gifts] = await Promise.all([
          Stroke.find({ roomId, canvasId: activeCanvas._id }).sort({ createdAt: 1 }),
          Message.find({ roomId }).sort({ createdAt: 1 }).limit(100),
          UserHistory.find({ roomId }).sort({ joinedAt: -1 }).limit(50),
          Canvas.find({ roomId }).sort({ createdAt: -1 }),
          Gift.find({ roomId })
        ]);

        // Record this join event
        const newHistoryEntry = new UserHistory({
          roomId,
          userId: socket.id,
          userName,
          joinedAt: new Date()
        });
        await newHistoryEntry.save();

        socket.emit('active-canvas-update', activeCanvas);
        socket.emit('canvas-list-update', allCanvases);
        socket.emit('canvas-history', strokes);
        socket.emit('chat-history', messages);
        socket.emit('movie-update-remote', rooms.get(roomId).movie);
        socket.emit('music-update-remote', rooms.get(roomId).music || {});
        socket.emit('gift-list-update', gifts);
        io.to(roomId).emit('user-history-update', await UserHistory.find({ roomId }).sort({ joinedAt: -1 }).limit(50));
      } catch (error) {
        console.error('Error fetching room history:', error);
      }
    }


    // Notify others
    const room = rooms.get(roomId);
    if (room) {
      const usersInRoom = Array.from(room.users.entries()).map(([id, name]) => ({ id, name }));
      io.to(roomId).emit('user-list-update', usersInRoom);
      socket.to(roomId).emit('notification', { message: `${userName} joined the room` });
    }
  });

  socket.on('draw', async (data) => {
    const { roomId, canvasId, stroke } = data;
    if (!roomId || !stroke) return;

    // Broadcast to others immediately for low latency
    const strokeWithUser = { ...stroke, userId: socket.id, canvasId };
    socket.to(roomId).emit('draw-remote', strokeWithUser);

    // Save/Update in database (only if DB is connected)
    if (mongoose.connection.readyState === 1) {
      try {
        await Stroke.findOneAndUpdate(
          { id: stroke.id }, // Match by our custom nanoid
          {
            roomId,
            canvasId,
            userId: socket.id,
            ...stroke
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error('Error saving/updating stroke:', error);
      }
    }
  });

  socket.on('create-canvas', async ({ roomId, name, userName }) => {
    if (!roomId || !name) return;

    try {
      const newCanvas = new Canvas({
        name,
        roomId,
        createdBy: userName
      });
      await newCanvas.save();

      // Notify everyone in the room about the new canvas
      const allCanvases = await Canvas.find({ roomId }).sort({ createdAt: -1 });
      io.to(roomId).emit('canvas-list-update', allCanvases);

      // Switch everyone to the new canvas
      io.to(roomId).emit('active-canvas-update', newCanvas);
      io.to(roomId).emit('canvas-history', []); // New canvas is empty
    } catch (error) {
      console.error('Error creating canvas:', error);
    }
  });

  socket.on('switch-canvas', async ({ roomId, canvasId }) => {
    if (!roomId || !canvasId) return;

    try {
      const [canvas, strokes] = await Promise.all([
        Canvas.findById(canvasId),
        Stroke.find({ roomId, canvasId }).sort({ createdAt: 1 })
      ]);

      if (canvas) {
        io.to(roomId).emit('active-canvas-update', canvas);
        io.to(roomId).emit('canvas-history', strokes);
      }
    } catch (error) {
      console.error('Error switching canvas:', error);
    }
  });

  socket.on('clear-canvas', async ({ roomId, canvasId }) => {
    if (!roomId || !canvasId) return;

    try {
      if (mongoose.connection.readyState === 1) {
        await Stroke.deleteMany({ roomId, canvasId });
      }
      io.to(roomId).emit('clear-canvas-remote', { canvasId });
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  });

  socket.on('delete-stroke', async ({ roomId, strokeId }) => {
    if (!roomId || !strokeId) return;

    // Broadcast to others
    socket.to(roomId).emit('delete-stroke-remote', strokeId);

    // Remove from DB
    if (mongoose.connection.readyState === 1) {
      try {
        const query = { $or: [{ id: strokeId }] };
        if (mongoose.Types.ObjectId.isValid(strokeId)) {
          query.$or.push({ _id: strokeId });
        }
        await Stroke.deleteOne(query);
      } catch (error) {
        // If strokeId was a nanoid instead of ObjectId, fallback to a custom field if needed
        // For now, we assume strokeId is the MongoDB _id
        try {
          // If the ID was actually passed as a string but saved differently
          await Stroke.deleteOne({ strokeId: strokeId });
        } catch (e) {
          console.error('Error deleting stroke:', e);
        }
      }
    }
  });

  socket.on('send-message', async ({ roomId, userName, text }) => {
    if (!roomId || !userName || !text) return;

    const messageData = {
      roomId,
      userId: socket.id,
      userName,
      text,
      createdAt: new Date()
    };

    // Broadcast to others
    socket.to(roomId).emit('receive-message', messageData);

    // Save to database
    if (mongoose.connection.readyState === 1) {
      try {
        const newMessage = new Message(messageData);
        await newMessage.save();

        // Send push notifications to others in the room
        const subscriptions = await PushSubscription.find({
          roomId,
          userId: { $ne: socket.id }
        });

        const pushPayload = {
          title: `New Message: ${roomId}`,
          body: `${userName}: ${text}`,
          data: { roomId, type: 'chat' },
          icon: '/favicon.svg'
        };

        subscriptions.forEach(async (sub) => {
          const result = await sendPushNotification(sub.subscription, pushPayload);
          if (result.error === 'GONE') {
            await PushSubscription.deleteOne({ _id: sub._id });
          }
        });
      } catch (error) {
        console.error('Error saving message or sending push:', error);
      }
    }
  });

  socket.on('subscribe-push', async (data) => {
    const { roomId, userId, userName, subscription } = data;
    if (!roomId || !userId || !subscription) return;

    try {
      if (mongoose.connection.readyState === 1) {
        await PushSubscription.findOneAndUpdate(
          { roomId, userId },
          { roomId, userId, userName, subscription },
          { upsert: true, new: true }
        );
        console.log(`Push subscription saved for ${userName} in ${roomId}`);
      }
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  });

  socket.on('webrtc-signal', (data) => {
    // data: { to, from, signal }
    io.to(data.to).emit('webrtc-signal', {
      from: socket.id,
      signal: data.signal
    });
  });

  socket.on('cursor-move', ({ roomId, userName, position, vibe }) => {
    socket.to(roomId).emit('cursor-move-remote', { userId: socket.id, userName, position, vibe });
  });

  socket.on('cursor-reaction', ({ roomId, emoji, position }) => {
    socket.to(roomId).emit('cursor-reaction-remote', { userId: socket.id, emoji, position });
  });

  socket.on('change-background', async ({ roomId, color }) => {
    if (!roomId) return;
    
    // Broadcast to others immediately
    socket.to(roomId).emit('background-changed', color);

    // Persist to database
    if (mongoose.connection.readyState === 1) {
      try {
        // Update the most recently created/active canvas for this room
        const activeCanvas = await Canvas.findOne({ roomId }).sort({ createdAt: -1 });
        if (activeCanvas) {
          activeCanvas.bgColor = color;
          await activeCanvas.save();
        }
      } catch (error) {
        console.error('Error saving background color:', error);
      }
    }
  });

  socket.on('movie-update', (data) => {
    // data: { roomId, url, playing, currentTime, action: 'play'|'pause'|'seek'|'url' }
    const { roomId } = data;
    if (!roomId || !rooms.has(roomId)) return;

    // Update server-side state
    const room = rooms.get(roomId);
    if (data.action === 'url') {
      room.movie.url = data.url;
      room.movie.masterId = socket.id; // Person who loads URL becomes Master
    }
    if (data.action === 'play') room.movie.playing = true;
    if (data.action === 'pause') room.movie.playing = false;
    if (data.action === 'seek') room.movie.currentTime = data.currentTime;

    // Broadcast update including masterId to everyone in the room
    io.to(roomId).emit('movie-update-remote', { ...data, masterId: room.movie.masterId });
  });

  socket.on('movie-time-report', (data) => {
    const { roomId, currentTime } = data;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.movie.currentTime = currentTime;
      // Broadcast current master time to other participants
      socket.to(roomId).emit('movie-update-remote', {
        roomId,
        currentTime,
        masterId: room.movie.masterId
      });
    }
  });

  socket.on('request-master-sync', (data) => {
    const { roomId } = data;
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.movie.masterId) {
      // Ask master for their current time
      io.to(room.movie.masterId).emit('get-master-time', { requesterId: socket.id });
    }
  });

  socket.on('master-time-response', (data) => {
    const { requesterId, currentTime, roomId } = data;

    // Update server state with the master's latest time
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).movie.currentTime = currentTime;
    }

    if (requesterId) {
      io.to(requesterId).emit('sync-to-master', { currentTime });
    }
  });

  socket.on('music-update', (data) => {
    // data: { roomId, url, playing, currentTime, title, artist, thumbnail, action: 'play'|'pause'|'seek'|'url' }
    const { roomId } = data;
    if (!roomId || !rooms.has(roomId)) return;

    // Update server-side state
    const room = rooms.get(roomId);
    if (!room.music) {
      room.music = { url: '', playing: false, currentTime: 0, masterId: null, title: '', artist: '', thumbnail: '' };
    }

    if (data.action === 'url') {
      room.music.url = data.url;
      room.music.title = data.title;
      room.music.artist = data.artist;
      room.music.thumbnail = data.thumbnail;
      room.music.masterId = socket.id;
    }
    if (data.action === 'play') room.music.playing = true;
    if (data.action === 'pause') room.music.playing = false;
    if (data.action === 'seek') room.music.currentTime = data.currentTime;

    // Broadcast update
    io.to(roomId).emit('music-update-remote', { ...data, masterId: room.music.masterId });
  });

  socket.on('music-time-report', (data) => {
    const { roomId, currentTime } = data;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (room.music) {
        room.music.currentTime = currentTime;
        socket.to(roomId).emit('music-update-remote', {
          roomId,
          currentTime,
          masterId: room.music.masterId
        });
      }
    }
  });

  // --- Game Events ---
  socket.on('game-invite', ({ roomId, from, to, gameId }) => {
    if (!roomId || !to) return;
    io.to(to.id).emit('receive-game-invite', { from, gameId, roomId });
  });

  socket.on('game-invite-response', ({ roomId, from, to, accepted, gameId }) => {
    if (!roomId || !to) return;
    io.to(to.id).emit('game-invite-result', { from, accepted, gameId });
  });

  socket.on('game-move', ({ roomId, to, move }) => {
    if (!roomId || !to) return;
    io.to(to.id).emit('receive-game-move', move);
  });

  socket.on('game-reset', ({ roomId, to }) => {
    if (!roomId || !to) return;
    io.to(to.id).emit('receive-game-reset');
  });

  socket.on('get-game-score', async ({ gameId, player1, player2 }) => {
    if (!gameId || !player1 || !player2) return;

    // Always sort players alphabetically to find the correct record
    const players = [player1, player2].sort();

    try {
      if (mongoose.connection.readyState === 1) {
        let score = await GameScore.findOne({
          gameId,
          player1: players[0],
          player2: players[1]
        });

        if (!score) {
          score = new GameScore({
            gameId,
            player1: players[0],
            player2: players[1]
          });
          await score.save();
        }
        socket.emit('receive-game-score', score);
      }
    } catch (error) {
      console.error('Error handling get-game-score:', error);
    }
  });

  socket.on('update-game-score', async ({ roomId, gameId, player1, player2, winner }) => {
    if (!gameId || !player1 || !player2) return;

    const players = [player1, player2].sort();

    try {
      if (mongoose.connection.readyState === 1) {
        let score = await GameScore.findOne({
          gameId,
          player1: players[0],
          player2: players[1]
        });

        if (!score) {
          score = new GameScore({
            gameId,
            player1: players[0],
            player2: players[1]
          });
        }

        if (winner === 'Draw') {
          score.draws += 1;
        } else if (winner === players[0]) {
          score.score1 += 1;
        } else if (winner === players[1]) {
          score.score2 += 1;
        }

        score.lastPlayed = new Date();
        await score.save();

        // Broadcast to both players in the room (or just the two players)
        if (roomId) {
          io.to(roomId).emit('receive-game-score', score);
        } else {
          socket.emit('receive-game-score', score);
        }
      }
    } catch (error) {
      console.error('Error updating game score:', error);
    }
  });

  socket.on('get-user-history', async (roomId) => {
    if (!roomId) return;
    if (mongoose.connection.readyState === 1) {
      try {
        const history = await UserHistory.find({ roomId }).sort({ joinedAt: -1 }).limit(50);
        socket.emit('user-history-update', history);
      } catch (error) {
        console.error('Error fetching user history:', error);
      }
    }
  });

  // --- Gift Events ---
  socket.on('send-gift', async (giftData) => {
    const { roomId, senderId, senderName, content, contentType, unlockDate, position } = giftData;
    if (!roomId || !senderId || !content || !unlockDate) return;

    try {
      if (mongoose.connection.readyState === 1) {
        const newGift = new Gift({
          roomId,
          senderId,
          senderName,
          content,
          contentType,
          unlockDate,
          position: position || { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 }
        });
        await newGift.save();

        // Notify everyone in the room
        io.to(roomId).emit('receive-gift', newGift);
        
        // Update gift list for everyone
        const allGifts = await Gift.find({ roomId });
        io.to(roomId).emit('gift-list-update', allGifts);
      }
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  });

  socket.on('open-gift', async ({ giftId, roomId }) => {
    if (!giftId || !roomId) return;

    try {
      if (mongoose.connection.readyState === 1) {
        const gift = await Gift.findByIdAndUpdate(giftId, { isOpened: true }, { new: true });
        if (gift) {
          // Add to Memory Vault automatically
          // Add to Memory Vault automatically
          let vaultImageUrl = '';
          let vaultCaption = '';
          let vaultContentType = 'image';

          if (gift.contentType === 'capsule') {
            vaultImageUrl = gift.content.imageUrl || '';
            vaultCaption = gift.content.message || `Time Capsule from ${gift.senderName}`;
            vaultContentType = gift.content.imageUrl ? 'image' : 'message';
          } else {
            // Legacy/Fallback for old gift types
            vaultImageUrl = gift.contentType === 'message' ? '' : gift.content;
            vaultCaption = gift.contentType === 'message' ? gift.content : `Time Capsule from ${gift.senderName}`;
            vaultContentType = gift.contentType === 'message' ? 'message' : 'image';
          }

          const giftMemory = new Memory({
            roomId,
            imageUrl: vaultImageUrl,
            caption: vaultCaption,
            createdBy: gift.senderName,
            type: 'gift',
            contentType: vaultContentType
          });
          await giftMemory.save();

          // Broadcast that it's opened and update memory vault for everyone
          io.to(roomId).emit('gift-opened', gift);
          
          const memories = await Memory.find({ roomId }).sort({ createdAt: -1 });
          io.to(roomId).emit('memories-update', memories); // We need to add this listener on client
          
          const allGifts = await Gift.find({ roomId });
          io.to(roomId).emit('gift-list-update', allGifts);
        }
      }
    } catch (error) {
      console.error('Error opening gift:', error);
    }
  });

  socket.on('delete-gift', async ({ giftId, roomId }) => {
    if (!giftId || !roomId) return;
    try {
      if (mongoose.connection.readyState === 1) {
        await Gift.findByIdAndDelete(giftId);
        const allGifts = await Gift.find({ roomId });
        io.to(roomId).emit('gift-list-update', allGifts);
      }
    } catch (error) {
      console.error('Error deleting gift:', error);
    }
  });

  socket.on('disconnecting', () => {
    // rooms is Map<roomId, Map<socketId, userName>>
    socket.rooms.forEach(async (roomId) => {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const userName = room.users.get(socket.id);

        if (userName) {
          room.users.delete(socket.id);
          console.log(`${userName} left room: ${roomId}`);

          // Update UserHistory
          if (mongoose.connection.readyState === 1) {
            try {
              await UserHistory.findOneAndUpdate(
                { userId: socket.id, roomId, leftAt: null },
                { leftAt: new Date() },
                { sort: { joinedAt: -1 } }
              );
              io.to(roomId).emit('user-history-update', await UserHistory.find({ roomId }).sort({ joinedAt: -1 }).limit(50));
            } catch (err) {
              console.error('Error updating user history on disconnect:', err);
            }
          }

          const usersInRoom = Array.from(room.users.entries()).map(([id, name]) => ({ id, name }));
          io.to(roomId).emit('user-list-update', usersInRoom);
          socket.to(roomId).emit('notification', { message: `${userName} left the room` });

          // Clean up empty rooms
          if (room.users.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
