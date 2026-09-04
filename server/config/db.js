const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  const connection = await mongoose.connect(mongoUri, {
    connectTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 5000,
    serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 5000,
  });
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

module.exports = connectDB;
