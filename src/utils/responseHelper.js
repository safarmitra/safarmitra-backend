/**
 * Send success response
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
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
