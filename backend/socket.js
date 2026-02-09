const { Server } = require('socket.io');
const { setIO, verifySocketAuth } = require('./utils/socketEmitter');

const MAX_CONNECTIONS_PER_USER = 5;

/**
 * Attach Socket.IO to HTTP server. Auth via handshake: query userId + token (sha256(userId + SOCKET_SECRET)).
 */
function attachSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
    maxHttpBufferSize: 1e6,
  });

  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!verifySocketAuth(userId, token)) {
      return next(new Error('Socket authentication failed'));
    }
    socket.userId = String(userId).trim();
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const room = userId;
    const count = io.sockets.adapter.rooms.get(room)?.size ?? 0;
    if (count >= MAX_CONNECTIONS_PER_USER) {
      socket.emit('error', { message: 'Too many connections' });
      socket.disconnect(true);
      return;
    }
    socket.join(room);
    socket.emit('connected', { userId: room });
  });

  io.on('disconnect', () => {});
  setIO(io);
  console.log('✅ Socket.IO attached');
  return io;
}

module.exports = { attachSocket };
