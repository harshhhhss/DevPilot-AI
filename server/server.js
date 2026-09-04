const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const bugRoutes = require('./routes/bugRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsGlobalRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// AI endpoints call an external provider and are the most expensive/abuse-prone
// route group, so they get a tighter limiter than the general API.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests, please slow down.' },
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the DevPilot AI API',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/bugs', bugRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai', aiLimiter, aiRoutes);

// Legacy unversioned aliases kept for the existing frontend health check.
app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Server startup failed: ${error.message}`);
      process.exit(1);
    }

    console.warn(`MongoDB connection failed: ${error.message}`);
    console.warn('Starting API without database connection for local development.');
  }

  httpServer.listen(PORT, () => {
    console.log(`DevPilot AI API running on port ${PORT}`);
  });
};

startServer();

module.exports = app;
