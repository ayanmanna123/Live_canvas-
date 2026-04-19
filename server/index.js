import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Message from './models/Message.js';
import Stroke from './models/Stroke.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
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

    // Send existing strokes and chat history to the new user (only if DB is connected)
    if (mongoose.connection.readyState === 1) {
      try {
        const [strokes, messages] = await Promise.all([
          Stroke.find({ roomId }).sort({ createdAt: 1 }),
          Message.find({ roomId }).sort({ createdAt: 1 }).limit(100)
        ]);
        socket.emit('canvas-history', strokes);
        socket.emit('chat-history', messages);
      } catch (error) {
        console.error('Error fetching room history:', error);
      }
    }

    // Notify others
    const usersInRoom = Array.from(rooms.get(roomId).entries()).map(([id, name]) => ({ id, name }));
    io.to(roomId).emit('user-list-update', usersInRoom);
    socket.to(roomId).emit('notification', { message: `${userName} joined the room` });
  });

  socket.on('draw', async (data) => {
    const { roomId, stroke } = data;
    if (!roomId || !stroke) return;
    
    // Broadcast to others immediately for low latency
    socket.to(roomId).emit('draw-remote', stroke);

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
        await Stroke.deleteOne({ _id: strokeId });
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
      } catch (error) {
        console.error('Error saving message:', error);
      }
    }
  });

  socket.on('cursor-move', ({ roomId, userName, position }) => {
    if (!roomId) return;
    socket.to(roomId).emit('cursor-move-remote', {
      userId: socket.id,
      userName,
      position
    });
  });

  socket.on('disconnecting', () => {
    // rooms is Map<roomId, Map<socketId, userName>>
    socket.rooms.forEach(roomId => {
      if (rooms.has(roomId)) {
        const roomUsers = rooms.get(roomId);
        const userName = roomUsers.get(socket.id);
        
        if (userName) {
          roomUsers.delete(socket.id);
          console.log(`${userName} left room: ${roomId}`);
          
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
