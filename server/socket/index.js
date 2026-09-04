const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const { canViewProject } = require('../utils/accessControl');
const { ROLES } = require('../utils/roles');

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

    // Rooms carry project-scoped chat/comment/task/bug broadcasts, so joining
    // one is only allowed for users who can actually view that project —
    // otherwise anyone authenticated could eavesdrop on any project's room.
    const isProjectMember = async (projectId) => {
      const project = await Project.findById(projectId).select('manager members organization');
      return Boolean(project) && canViewProject(project, socket.user);
    };

    socket.on('project:join', async (projectId) => {
      if (projectId && (await isProjectMember(projectId))) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on('project:leave', (projectId) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });

    socket.on('chat:message', async ({ projectId, content }) => {
      if (!projectId || !content?.trim()) return;
      // SRS 5.2: chat/comments are Deny for Viewer (Stakeholder).
      if (socket.user.role === ROLES.STAKEHOLDER) return;
      if (!(await isProjectMember(projectId))) return;

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
