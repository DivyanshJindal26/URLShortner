const mongoose = require('mongoose');
const logger = require('./logger');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/urlshortner';

async function connectDB() {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  logger.info('MongoDB connected');
}

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected — reconnecting…'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error', { message: err.message }));

module.exports = { connectDB, mongoose };
