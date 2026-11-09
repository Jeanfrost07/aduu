const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for rooms and users (ephemeral - no persistence)
const rooms = new Map();
const userSockets = new Map();

// Generate random username
function generateUsername() {
  const adjectives = ['Swift', 'Silent', 'Cosmic', 'Neon', 'Velvet', 'Azure', 'Crimson', 'Golden', 'Lunar', 'Solar'];
  const nouns = ['Phoenix', 'Dragon', 'Wolf', 'Eagle', 'Tiger', 'Shark', 'Falcon', 'Lynx', 'Bear', 'Fox'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 999)}`;
}

// Create or get room
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      users: new Map(),
      messages: [],
      createdAt: Date.now()
    });
  }
  return rooms.get(roomId);
}

// Clean up empty rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (room.users.size === 0 && now - room.createdAt > 300000) { // 5 minutes empty
      rooms.delete(roomId);
    }
  }
}, 60000);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room
  socket.on('join-room', ({ roomId, username }) => {
    const finalRoomId = roomId || 'general';
    const finalUsername = username || generateUsername();

    socket.join(finalRoomId);
    userSockets.set(socket.id, { roomId: finalRoomId, username: finalUsername });

    const room = getOrCreateRoom(finalRoomId);
    room.users.set(socket.id, { id: socket.id, username: finalUsername, joinedAt: Date.now() });

    // Send current room state to the joining user
    socket.emit('room-state', {
      roomId: finalRoomId,
      username: finalUsername,
      users: Array.from(room.users.values()).map(u => ({ id: u.id, username: u.username })),
      messages: room.messages.slice(-100) // Last 100 messages
    });

    // Notify others in room
    socket.to(finalRoomId).emit('user-joined', {
      user: { id: socket.id, username: finalUsername },
      users: Array.from(room.users.values()).map(u => ({ id: u.id, username: u.username }))
    });

    console.log(`${finalUsername} joined room ${finalRoomId}`);
  });

  // Handle new message
  socket.on('send-message', ({ content, type = 'text' }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    const room = rooms.get(userInfo.roomId);
    if (!room) return;

    const message = {
      id: uuidv4(),
      userId: socket.id,
      username: userInfo.username,
      content,
      type,
      timestamp: Date.now()
    };

    room.messages.push(message);
    // Keep only last 200 messages in memory
    if (room.messages.length > 200) {
      room.messages = room.messages.slice(-200);
    }

    // Broadcast to room
    io.to(userInfo.roomId).emit('new-message', message);
  });

  // Typing indicator
  socket.on('typing', ({ isTyping }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    socket.to(userInfo.roomId).emit('user-typing', {
      userId: socket.id,
      username: userInfo.username,
      isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      const room = rooms.get(userInfo.roomId);
      if (room) {
        room.users.delete(socket.id);

        // Notify others
        socket.to(userInfo.roomId).emit('user-left', {
          userId: socket.id,
          username: userInfo.username,
          users: Array.from(room.users.values()).map(u => ({ id: u.id, username: u.username }))
        });

        console.log(`${userInfo.username} left room ${userInfo.roomId}`);
      }
      userSockets.delete(socket.id);
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                      🌊 aduu server                          ║
║                  Ephemeral Chat Running                      ║
║                                                              ║
║    Local:   http://localhost:${PORT}                           ║
║    Network: http://<your-ip>:${PORT}                           ║
║                                                              ║
║    No logs saved • No database • Pure memory                ║
╚══════════════════════════════════════════════════════════════╝
  `);
});