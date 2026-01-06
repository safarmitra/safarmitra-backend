/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Pagination meta (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = null, message = 'Success', meta = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} errorCode - Error code (optional)
 * @param {Array} details - Error details (optional)
 */
const sendError = (res, message = 'Error', statusCode = 500, errorCode = null, details = null) => {
  const response = {
    success: false,
    message,
  };

  if (errorCode || details) {
    response.error = {};
    if (errorCode) response.error.code = errorCode;
    if (details) response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
