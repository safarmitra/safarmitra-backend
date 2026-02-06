/**
 * Custom Application Error Class
 * 
 * This class provides a standardized way to create errors with:
 * - User-friendly message (shown to user)
 * - Internal message (for logging only)
 * - Error code (for debugging)
 * - HTTP status code
 * 
 * Usage:
 *   throw new AppError('User-friendly message', 400, 'INTERNAL_CODE', 'Detailed internal message');
 */

const { ERROR_MESSAGES, ERROR_CODES } = require('./errorMessages');

class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - User-friendly message (shown to user)
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Internal error code for logging
   * @param {string} internalMessage - Detailed message for logging (not shown to user)
   */
  constructor(message, statusCode = 500, errorCode = null, internalMessage = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode || ERROR_CODES.INTERNAL_ERROR;
    this.internalMessage = internalMessage || message;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message = ERROR_MESSAGES.INVALID_INPUT, errorCode = null, internalMessage = null) {
    return new AppError(message, 400, errorCode || ERROR_CODES.VALIDATION_ERROR, internalMessage);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message = ERROR_MESSAGES.UNAUTHORIZED, errorCode = null, internalMessage = null) {
    return new AppError(message, 401, errorCode || ERROR_CODES.AUTH_TOKEN_INVALID, internalMessage);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message = ERROR_MESSAGES.ACCESS_DENIED, errorCode = null, internalMessage = null) {
    return new AppError(message, 403, errorCode || ERROR_CODES.USER_PERMISSION_DENIED, internalMessage);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message = ERROR_MESSAGES.RESOURCE_NOT_FOUND, errorCode = null, internalMessage = null) {
    return new AppError(message, 404, errorCode, internalMessage);
  }

  /**
   * Create a 409 Conflict error (for duplicates)
   */
  static conflict(message, errorCode = null, internalMessage = null) {
    return new AppError(message, 409, errorCode, internalMessage);
  }

  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(message = ERROR_MESSAGES.DAILY_LIMIT_REACHED, errorCode = null, internalMessage = null) {
    return new AppError(message, 429, errorCode || ERROR_CODES.BOOKING_LIMIT_REACHED, internalMessage);
  }

  /**
   * Create a 500 Internal Server error
   */
  static internal(message = ERROR_MESSAGES.SOMETHING_WENT_WRONG, errorCode = null, internalMessage = null) {
    return new AppError(message, 500, errorCode || ERROR_CODES.INTERNAL_ERROR, internalMessage);
  }

  // ============================================
  // Pre-defined errors for common scenarios
  // ============================================

  // Auth errors
  static invalidCredentials(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.INVALID_CREDENTIALS,
      401,
      ERROR_CODES.AUTH_TOKEN_INVALID,
      internalMessage
    );
  }

  static sessionExpired(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.SESSION_EXPIRED,
      401,
      ERROR_CODES.AUTH_TOKEN_EXPIRED,
      internalMessage
    );
  }

  static accountSuspended(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.ACCOUNT_SUSPENDED,
      403,
      ERROR_CODES.AUTH_ACCOUNT_SUSPENDED,
      internalMessage
    );
  }

  // KYC errors
  static kycNotApproved(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.KYC_NOT_APPROVED,
      403,
      ERROR_CODES.KYC_NOT_APPROVED,
      internalMessage
    );
  }

  static documentAlreadyRegistered(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.DOCUMENT_ALREADY_REGISTERED,
      409,
      ERROR_CODES.KYC_DOCUMENT_DUPLICATE,
      internalMessage
    );
  }

  static selectRoleFirst(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.SELECT_ROLE_FIRST,
      400,
      ERROR_CODES.KYC_ROLE_NOT_SELECTED,
      internalMessage
    );
  }

  // Car errors
  static carNotFound(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.RESOURCE_NOT_FOUND,
      404,
      ERROR_CODES.CAR_NOT_FOUND,
      internalMessage
    );
  }

  static carAlreadyRegistered(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.CAR_ALREADY_REGISTERED,
      409,
      ERROR_CODES.CAR_DUPLICATE,
      internalMessage
    );
  }

  static carNotAvailable(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.CAR_NOT_AVAILABLE,
      400,
      ERROR_CODES.CAR_NOT_ACTIVE,
      internalMessage
    );
  }

  // Booking errors
  static bookingNotFound(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.RESOURCE_NOT_FOUND,
      404,
      ERROR_CODES.BOOKING_NOT_FOUND,
      internalMessage
    );
  }

  static requestAlreadyExists(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.REQUEST_ALREADY_EXISTS,
      409,
      ERROR_CODES.BOOKING_DUPLICATE,
      internalMessage
    );
  }

  static requestExpired(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.REQUEST_EXPIRED,
      400,
      ERROR_CODES.BOOKING_EXPIRED,
      internalMessage
    );
  }

  static requestAlreadyProcessed(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.REQUEST_ALREADY_PROCESSED,
      400,
      ERROR_CODES.BOOKING_INVALID_STATUS,
      internalMessage
    );
  }

  static cannotBookOwnCar(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.CANNOT_BOOK_OWN_CAR,
      400,
      ERROR_CODES.BOOKING_PERMISSION_DENIED,
      internalMessage
    );
  }

  static cannotInviteSelf(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.CANNOT_INVITE_SELF,
      400,
      ERROR_CODES.BOOKING_PERMISSION_DENIED,
      internalMessage
    );
  }

  static dailyLimitReached(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.DAILY_LIMIT_REACHED,
      429,
      ERROR_CODES.BOOKING_LIMIT_REACHED,
      internalMessage
    );
  }

  // User errors
  static userNotFound(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.RESOURCE_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND,
      internalMessage
    );
  }

  // Generic errors
  static accessDenied(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.ACCESS_DENIED,
      403,
      ERROR_CODES.USER_PERMISSION_DENIED,
      internalMessage
    );
  }

  static somethingWentWrong(internalMessage = null) {
    return new AppError(
      ERROR_MESSAGES.SOMETHING_WENT_WRONG,
      500,
      ERROR_CODES.INTERNAL_ERROR,
      internalMessage
    );
  }
}

module.exports = AppError;
