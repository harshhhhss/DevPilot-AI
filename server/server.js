const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the DevPilot AI API',
  });
});
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

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

  app.listen(PORT, () => {
    console.log(`DevPilot AI API running on port ${PORT}`);
  });
};

startServer();

module.exports = app;
