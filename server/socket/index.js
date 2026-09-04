const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const initSocket = (httpServer) => {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Authenticate every socket connection with the same JWT used for the REST API.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Not authorized, no token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Not authorized, user not found'));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error('Not authorized, token failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);

    socket.on('project:join', (projectId) => {
      if (projectId) socket.join(`project:${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });

    socket.on('chat:message', ({ projectId, content }) => {
      if (!projectId || !content?.trim()) return;

      const payload = {
        projectId,
        content: content.trim(),
        author: {
          _id: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar,
        },
        createdAt: new Date().toISOString(),
      };

      io.to(`project:${projectId}`).emit('chat:message', payload);
    });

    socket.on('typing:start', ({ projectId }) => {
      if (projectId) socket.to(`project:${projectId}`).emit('typing:start', { userId, name: socket.user.name });
    });

    socket.on('typing:stop', ({ projectId }) => {
      if (projectId) socket.to(`project:${projectId}`).emit('typing:stop', { userId });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
};

// Best-effort emit that no-ops if sockets are unavailable (e.g. seed scripts).
const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

const emitToProject = (projectId, event, payload) => {
  if (!io) return;
  io.to(`project:${projectId}`).emit(event, payload);
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToProject,
};
