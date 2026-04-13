const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
      silent: process.env.NODE_ENV === 'test',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

// Audit logger — financial actions only
const auditLogger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/audit.log'),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 30,
    }),
  ],
});

logger.audit = (userId, action, details = {}) => {
  auditLogger.info({ userId: userId?.toString(), action, details, ts: new Date().toISOString() });
};

module.exports = logger;
