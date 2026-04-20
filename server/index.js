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
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId).set(socket.id, userName);

    // Send existing strokes, chat history, and user history to the new user (only if DB is connected)
    if (mongoose.connection.readyState === 1) {
      try {
        const [strokes, messages, history] = await Promise.all([
          Stroke.find({ roomId }).sort({ createdAt: 1 }),
          Message.find({ roomId }).sort({ createdAt: 1 }).limit(100),
          UserHistory.find({ roomId }).sort({ joinedAt: -1 }).limit(50)
        ]);
        
        // Record this join event
        const newHistoryEntry = new UserHistory({
          roomId,
          userId: socket.id,
          userName,
          joinedAt: new Date()
        });
        await newHistoryEntry.save();

        socket.emit('canvas-history', strokes);
        socket.emit('chat-history', messages);
        io.to(roomId).emit('user-history-update', await UserHistory.find({ roomId }).sort({ joinedAt: -1 }).limit(50));
      } catch (error) {
        console.error('Error fetching room history:', error);
      }
    }

    // Notify others
    const room = rooms.get(roomId);
    if (room) {
      const usersInRoom = Array.from(room.entries()).map(([id, name]) => ({ id, name }));
      io.to(roomId).emit('user-list-update', usersInRoom);
      socket.to(roomId).emit('notification', { message: `${userName} joined the room` });
    }
  });

  socket.on('draw', async (data) => {
    const { roomId, stroke } = data;
    if (!roomId || !stroke) return;
    
    // Broadcast to others immediately for low latency
    const strokeWithUser = { ...stroke, userId: socket.id };
    socket.to(roomId).emit('draw-remote', strokeWithUser);

    // Save to database (only if DB is connected)
    if (mongoose.connection.readyState === 1) {
      try {
        const newStroke = new Stroke({
          roomId,
          userId: socket.id,
          ...stroke
        });
        await newStroke.save();
      } catch (error) {
        console.error('Error saving stroke:', error);
      }
    }
  });

  socket.on('clear-canvas', async (roomId) => {
    if (!roomId) return;
    
    try {
      if (mongoose.connection.readyState === 1) {
        await Stroke.deleteMany({ roomId });
      }
      io.to(roomId).emit('clear-canvas-remote');
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
    if (!roomId) return;
    socket.to(roomId).emit('movie-update-remote', data);
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
        const roomUsers = rooms.get(roomId);
        const userName = roomUsers.get(socket.id);
        
        if (userName) {
          roomUsers.delete(socket.id);
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

          const usersInRoom = Array.from(roomUsers.entries()).map(([id, name]) => ({ id, name }));
          io.to(roomId).emit('user-list-update', usersInRoom);
          socket.to(roomId).emit('notification', { message: `${userName} left the room` });
          
          // Clean up empty rooms
          if (roomUsers.size === 0) {
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
