const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = format;

const logLine = printf(({ level, message, timestamp, stack, ...meta }) => {
  const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${timestamp} [${level}] ${stack || message}${extras}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logLine),
  transports: [
    new transports.Console({
      format: combine(colorize(), errors({ stack: true }), timestamp({ format: 'HH:mm:ss' }), logLine),
    }),
    new transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(LOG_DIR, 'combined.log') }),
  ],
});

// Morgan stream — pipes HTTP access logs into winston
logger.morganStream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
