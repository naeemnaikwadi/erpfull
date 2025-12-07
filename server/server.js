require('dotenv').config();

const app = require('./app');
const http = require('http');
// Socket.io removed for deployment compatibility
// const { Server } = require('socket.io');

const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: '*' } });

// Socket.io event handlers - DISABLED FOR DEPLOYMENT
/*
io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // Join session (video room or chat)
  socket.on('joinSession', (sessionId) => {
    socket.join(sessionId);
    console.log(`🔗 User ${socket.id} joined session ${sessionId}`);
  });

  // Chat message for live session
  socket.on('chatMessage', ({ sessionId, message }) => {
    io.to(sessionId).emit('chatMessage', { sender: socket.id, message });
  });

  // General room join for WebRTC rooms or classroom rooms
  socket.on('join-room', ({ room, user }) => {
    socket.join(room);
    io.to(room).emit('user-joined', user);
  });

  // General messaging (e.g. polls, announcements)
  socket.on('message', ({ room, msg }) => {
    io.to(room).emit('room-message', msg);
  });

  socket.on('disconnect', () => {
    console.log('❌ A user disconnected:', socket.id);
  });
});
*/

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
