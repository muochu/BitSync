const logger = require('../utils/logger');

/**
 * Centralized error handling middleware
 * Keeps error handling consistent across the application
 */
function errorHandler(err, req, res, _next) {
  logger.error('Error:', err.message, err.stack);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const statusCode = err.statusCode || err.status || 500;
  const message = isDevelopment ? err.message : 'Internal server error';

  res.status(statusCode).json({
    error: {
      message,
      ...(isDevelopment && { stack: err.stack }),
    },
  });
}

/**
 * Async error wrapper - catches errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler,
};

