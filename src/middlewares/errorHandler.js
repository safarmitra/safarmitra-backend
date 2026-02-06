const { sendError } = require('../utils/responseHelper');
const { ERROR_MESSAGES, ERROR_CODES } = require('../utils/errorMessages');
const AppError = require('../utils/AppError');

/**
 * Log error details (for debugging)
 * In production, this could be sent to a logging service
 */
const logError = (err, req) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    errorCode: err.errorCode || 'UNKNOWN',
    statusCode: err.statusCode || 500,
    message: err.internalMessage || err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.user?.userId || 'anonymous',
    ip: req.ip,
  };

  // Log to console (in production, send to logging service)
  console.error('ERROR:', JSON.stringify(logData, null, 2));
};

/**
 * Handle Sequelize validation errors
 */
const handleSequelizeValidationError = (err) => {
  // Don't expose field names in production for security
  const message = ERROR_MESSAGES.INVALID_INPUT;
  return new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR, err.message);
};

/**
 * Handle Sequelize unique constraint errors
 */
const handleSequelizeUniqueError = (err) => {
  // Check which field caused the error
  const field = err.errors?.[0]?.path || '';
  
  // Provide specific messages for known fields
  if (field === 'document_number_hash') {
    return AppError.documentAlreadyRegistered(`Duplicate document: ${err.errors?.[0]?.value}`);
  }
  
  if (field === 'car_number') {
    return AppError.carAlreadyRegistered(`Duplicate car number: ${err.errors?.[0]?.value}`);
  }
  
  if (field === 'phone_number') {
    // Don't reveal if phone exists - security
    return new AppError(
      ERROR_MESSAGES.SOMETHING_WENT_WRONG,
      500,
      ERROR_CODES.DATABASE_ERROR,
      `Duplicate phone: ${err.errors?.[0]?.value}`
    );
  }
  
  if (field === 'email') {
    // Don't reveal if email exists - security
    return new AppError(
      ERROR_MESSAGES.SOMETHING_WENT_WRONG,
      500,
      ERROR_CODES.DATABASE_ERROR,
      `Duplicate email: ${err.errors?.[0]?.value}`
    );
  }
  
  // Generic duplicate error
  return new AppError(
    ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    500,
    ERROR_CODES.DATABASE_ERROR,
    `Duplicate entry: ${field}`
  );
};

/**
 * Handle Sequelize database errors
 */
const handleSequelizeDatabaseError = (err) => {
  return new AppError(
    ERROR_MESSAGES.SERVER_ERROR,
    500,
    ERROR_CODES.DATABASE_ERROR,
    err.message
  );
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return AppError.sessionExpired('Invalid JWT token');
};

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () => {
  return AppError.sessionExpired('JWT token expired');
};

/**
 * Handle multer file size errors
 */
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError(ERROR_MESSAGES.FILE_TOO_LARGE, 400, 'FILE_001', err.message);
  }
  return new AppError(ERROR_MESSAGES.UPLOAD_FAILED, 400, 'FILE_002', err.message);
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
  return sendError(
    res,
    err.message,
    err.statusCode,
    err.errorCode,
    process.env.NODE_ENV === 'development' ? [{ internal: err.internalMessage, stack: err.stack }] : null
  );
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode, err.errorCode);
  }
  
  // Programming or unknown error: don't leak details
  console.error('UNEXPECTED ERROR:', err);
  return sendError(
    res,
    ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    500,
    ERROR_CODES.INTERNAL_ERROR
  );
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Set defaults
  err.statusCode = err.statusCode || 500;
  err.errorCode = err.errorCode || ERROR_CODES.INTERNAL_ERROR;

  // Log the error
  logError(err, req);

  // Handle specific error types
  let error = err;

  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    error = handleSequelizeValidationError(err);
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    error = handleSequelizeUniqueError(err);
  }
  if (err.name === 'SequelizeDatabaseError') {
    error = handleSequelizeDatabaseError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Multer errors
  if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }

  // Convert non-AppError to AppError
  if (!(error instanceof AppError)) {
    // Check if it's a known error message pattern
    const message = error.message || '';
    
    // Map known error messages to AppError
    if (message.includes('suspended')) {
      error = AppError.accountSuspended(message);
    } else if (message.includes('not found') || message.includes('Not found')) {
      error = AppError.notFound(ERROR_MESSAGES.RESOURCE_NOT_FOUND, null, message);
    } else if (message.includes('permission') || message.includes('Permission')) {
      error = AppError.accessDenied(message);
    } else if (message.includes('already registered') || message.includes('already exists')) {
      // Check context for specific duplicate type
      if (message.toLowerCase().includes('document') || message.toLowerCase().includes('aadhaar') || 
          message.toLowerCase().includes('pan') || message.toLowerCase().includes('license')) {
        error = AppError.documentAlreadyRegistered(message);
      } else if (message.toLowerCase().includes('car') || message.toLowerCase().includes('registration')) {
        error = AppError.carAlreadyRegistered(message);
      } else if (message.toLowerCase().includes('request') || message.toLowerCase().includes('pending')) {
        error = AppError.requestAlreadyExists(message);
      } else {
        error = new AppError(ERROR_MESSAGES.SOMETHING_WENT_WRONG, 409, ERROR_CODES.DATABASE_ERROR, message);
      }
    } else if (message.includes('expired')) {
      error = AppError.requestExpired(message);
    } else if (message.includes('limit')) {
      error = AppError.dailyLimitReached(message);
    } else if (message.includes('own car')) {
      error = AppError.cannotBookOwnCar(message);
    } else if (message.includes('yourself') || message.includes('invite yourself')) {
      error = AppError.cannotInviteSelf(message);
    } else if (message.includes('role')) {
      error = AppError.selectRoleFirst(message);
    } else if (message.includes('KYC') || message.includes('kyc')) {
      error = AppError.kycNotApproved(message);
    } else {
      // Unknown error - use generic message
      error = new AppError(
        ERROR_MESSAGES.SOMETHING_WENT_WRONG,
        err.statusCode || 500,
        ERROR_CODES.INTERNAL_ERROR,
        message
      );
    }
  }

  // Send response based on environment
  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(error, res);
  }
  
  return sendErrorProd(error, res);
};

/**
 * Not found handler
 */
const notFoundHandler = (req, res) => {
  return sendError(res, ERROR_MESSAGES.ROUTE_NOT_FOUND, 404, 'NOT_FOUND');
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
