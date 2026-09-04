const mongoose = require('mongoose');

const getHealth = (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.status(200).json({
    success: true,
    message: 'DevPilot AI API is running',
    data: {
      service: 'devpilot-ai-api',
      environment: process.env.NODE_ENV || 'development',
      database: dbStates[mongoose.connection.readyState] || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = {
  getHealth,
};
