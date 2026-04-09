const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/urlshortner';

async function connectDB() {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  console.log('MongoDB connected:', MONGO_URI);
}

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected — reconnecting…'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));

module.exports = { connectDB, mongoose };
