const { sendError } = require('../utils/responseHelper');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 'Validation error', 400, 'VALIDATION_ERROR', details);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 'Duplicate entry', 409, 'DUPLICATE_ERROR', details);
  }

  // Sequelize database error
  if (err.name === 'SequelizeDatabaseError') {
    return sendError(res, 'Database error', 500, 'DATABASE_ERROR');
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';

  return sendError(res, message, statusCode, errorCode);
};

/**
 * Not found handler
 */
const notFoundHandler = (req, res) => {
  return sendError(res, 'Route not found', 404, 'NOT_FOUND');
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
