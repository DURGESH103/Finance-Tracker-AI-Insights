const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;

// Register lifecycle listeners exactly once
const registerListeners = () => {
  mongoose.connection.on('disconnected', () =>
    logger.warn('MongoDB disconnected — Mongoose will auto-reconnect')
  );
  mongoose.connection.on('reconnected', () =>
    logger.info('MongoDB reconnected')
  );
  mongoose.connection.on('error', (err) =>
    logger.error('MongoDB error', { error: err.message })
  );
};

let listenersRegistered = false;

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
    });

    if (!listenersRegistered) {
      registerListeners();
      listenersRegistered = true;
    }

    logger.info(`✅ MongoDB connected: ${conn.connection.host} (${conn.connection.name})`);
  } catch (err) {
    logger.error(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES})`, {
      error: err.message,
    });

    if (attempt < MAX_RETRIES) {
      // Exponential backoff: 2s, 4s, 8s, 16s
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
      logger.info(`Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
      return connectDB(attempt + 1);
    }

    logger.error('❌ Could not connect to MongoDB after max retries. Exiting.');
    process.exit(1);
  }
};

module.exports = connectDB;
