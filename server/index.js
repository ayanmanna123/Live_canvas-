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
import { sendPushNotification } from './utils/pushNotification.js';

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
        movie: { url: '', playing: false, currentTime: 0, masterId: null }
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

        const [strokes, messages, history, allCanvases] = await Promise.all([
          Stroke.find({ roomId, canvasId: activeCanvas._id }).sort({ createdAt: 1 }),
          Message.find({ roomId }).sort({ createdAt: 1 }).limit(100),
          UserHistory.find({ roomId }).sort({ joinedAt: -1 }).limit(50),
          Canvas.find({ roomId }).sort({ createdAt: -1 })
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

    // Save to database (only if DB is connected)
    if (mongoose.connection.readyState === 1) {
      try {
        const newStroke = new Stroke({
          roomId,
          canvasId,
          userId: socket.id,
          ...stroke
        });
        await newStroke.save();
      } catch (error) {
        console.error('Error saving stroke:', error);
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

  socket.on('cursor-move', ({ roomId, userName, position }) => {
    if (!roomId) return;
    socket.to(roomId).emit('cursor-move-remote', {
      userId: socket.id,
      userName,
      position
    });
  });

  socket.on('change-background', ({ roomId, color }) => {
    if (!roomId) return;
    socket.to(roomId).emit('background-changed', color);
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
