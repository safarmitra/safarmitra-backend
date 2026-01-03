const authService = require('../services/authService');
const { sendError } = require('../utils/responseHelper');

/**
 * Verify JWT token middleware
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access token is required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];

    const decoded = authService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
  }
};

/**
 * Role-based access control middleware
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!req.user.roleCode) {
      return sendError(res, 'Please select a role first', 403, 'ROLE_NOT_SELECTED');
    }

    if (!allowedRoles.includes(req.user.roleCode)) {
      return sendError(res, 'Access denied. Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
};

/**
 * KYC verification middleware
 */
const kycMiddleware = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
  }

  if (req.user.kycStatus !== 'APPROVED') {
    return sendError(
      res,
      'KYC verification required. Please complete your KYC.',
      403,
      'KYC_NOT_APPROVED'
    );
  }

  next();
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  kycMiddleware,
};
