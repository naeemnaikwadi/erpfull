/**
 * Production-ready logger utility
 * Use this instead of console.log in production
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log('ℹ️ [INFO]', message, ...args);
    }
  },

  success: (message, ...args) => {
    console.log('✅ [SUCCESS]', message, ...args);
  },

  error: (message, ...args) => {
    console.error('❌ [ERROR]', message, ...args);
  },

  warn: (message, ...args) => {
    console.warn('⚠️ [WARNING]', message, ...args);
  },

  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log('🔍 [DEBUG]', message, ...args);
    }
  },

  request: (req) => {
    if (isDevelopment) {
      console.log('🔍 [REQUEST]', {
        method: req.method,
        url: req.url,
        ip: req.ip
      });
    }
  }
};

module.exports = logger;
