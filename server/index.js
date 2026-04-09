require('dotenv').config();

// Validate required env vars at startup
const REQUIRED_ENV = ['API_KEY', 'ADMIN_PASSWORD', 'BASE_URL', 'MONGODB_URI'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');
const path = require('path');
const { connectDB } = require('./db');
const auth = require('./middleware/auth');

const app = express();

// --- Security & Logging ---
app.use(helmet({ contentSecurityPolicy: false })); // CSP off — we serve inline HTML for OG pages
app.use(cors());
app.use(morgan('combined', { stream: logger.morganStream }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Trust proxy (nginx sits in front)
app.set('trust proxy', 1);

// --- Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached, try again later' },
});

// --- Static Admin Dashboard ---
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// --- API Routes ---
// Login is public (no API key needed) — dashboard uses ADMIN_PASSWORD, gets API key back
app.post('/api/admin/login', apiLimiter, (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    logger.warn('Failed admin login attempt', { ip: req.ip });
    return res.status(401).json({ error: 'Wrong password' });
  }
  logger.info('Admin dashboard login', { ip: req.ip });
  res.json({ apiKey: process.env.API_KEY });
});

app.use('/api/shorten', apiLimiter, auth, require('./routes/shorten'));
app.use('/api/upload',  uploadLimiter, auth, require('./routes/upload'));
app.use('/api',         apiLimiter, auth, require('./routes/admin'));

// --- Public Routes ---
app.use('/i', require('./routes/images'));
app.use('/', require('./routes/redirect'));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  if (status >= 500) logger.error('Unhandled error', { err: err.message, stack: err.stack, path: req.path });
  else logger.warn('Client error', { status, message, path: req.path });
  res.status(status).json({ error: message });
});

// --- Start ---
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Base URL: ${process.env.BASE_URL}`);
    });

    // Graceful shutdown
    function shutdown(signal) {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        require('./db').mongoose.connection.close().then(() => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        });
      });
      // Force exit after 10s
      setTimeout(() => process.exit(1), 10_000);
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB', { message: err.message });
    process.exit(1);
  });
