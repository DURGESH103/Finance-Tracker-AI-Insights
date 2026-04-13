require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { correlationId } = require('./middleware/auth');
const logger = require('./utils/logger');
const scheduler = require('./jobs/scheduler');

connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Correlation ID + request logging ────────────────────────────────────────
app.use(correlationId);
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      correlationId: req.correlationId,
    });
  });
  next();
});

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api/v1/', rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
}));
app.use('/api/v1/auth/login',    rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many auth attempts' } }));
app.use('/api/v1/auth/register', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many auth attempts' } }));

// ── API v1 Routes ────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          require('./routes/auth'));
app.use('/api/v1/transactions',  require('./routes/transactions'));
app.use('/api/v1/budgets',       require('./routes/budgets'));
app.use('/api/v1/ai',            require('./routes/ai'));
app.use('/api/v1/goals',         require('./routes/goals'));
app.use('/api/v1/subscriptions', require('./routes/subscriptions'));
app.use('/api/v1/investments',   require('./routes/investments'));
app.use('/api/v1/simulator',     require('./routes/simulator'));
app.use('/api/v1/risks',         require('./routes/risks'));

// Legacy redirects
['auth', 'transactions', 'budgets', 'ai', 'goals', 'subscriptions', 'investments'].forEach((r) => {
  app.use(`/api/${r}`, (req, res) => res.redirect(307, `/api/v1/${r}${req.path}`));
});

app.get('/api/v1/health', (_, res) =>
  res.json({ success: true, status: 'ok', version: '1.0.0', timestamp: new Date() })
);

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    if (!userId) return;
    // Leave any previous rooms (handles reconnect without duplicate membership)
    [...socket.rooms].forEach((room) => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(userId);
    socket.userId = userId;
    logger.debug(`Socket joined room: ${userId}`);
  });

  socket.on('disconnect', (reason) => {
    logger.debug(`Socket disconnected: ${socket.userId} (${reason})`);
  });
});

// ── Background jobs ──────────────────────────────────────────────────────────
scheduler.init(io);

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} is already in use. Kill the existing process or change PORT in .env`);
    process.exit(1);
  }
  throw err;
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  scheduler.stop();

  // Force-exit after 10s if connections don't drain
  const forceExit = setTimeout(() => {
    logger.warn('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err.message, stack: err.stack });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
