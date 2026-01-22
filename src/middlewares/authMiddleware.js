const authService = require('../services/authService');
const { sendError } = require('../utils/responseHelper');

/**
 * Verify JWT token middleware
 * 
 * JWT is only issued when KYC is APPROVED, so we can trust the token data
 * No need to check database for role/KYC status on every request
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
 * Role-based access control middleware (array of roles)
 * 
 * Since JWT is only issued after KYC approval, we can trust the roleCode in token
 * No database lookup needed
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
 * Require specific role middleware (single role)
 * 
 * Since JWT is only issued after KYC approval, we can trust the roleCode in token
 * No database lookup needed
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!req.user.roleCode) {
      return sendError(res, 'Please select a role first', 403, 'ROLE_NOT_SELECTED');
    }

    if (req.user.roleCode !== role) {
      return sendError(res, 'Access denied. Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
};

/**
 * KYC verification middleware
 * 
 * Since JWT is only issued after KYC approval, we can trust the kycStatus in token
 * No database lookup needed
 * 
 * This middleware is kept for backward compatibility but should always pass
 * for valid JWT tokens (since JWT is only issued when KYC is APPROVED)
 */
const kycMiddleware = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
  }

  // JWT is only issued when KYC is APPROVED, so this should always pass
  // But we keep the check for safety
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

/**
 * Require KYC approval middleware (alias for kycMiddleware)
 */
const requireKyc = kycMiddleware;

/**
 * Require Admin role middleware
 * 
 * Since JWT is only issued after KYC approval, we can trust the roleCode in token
 * No database lookup needed
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
  }

  if (!req.user.roleCode) {
    return sendError(res, 'Please select a role first', 403, 'ROLE_NOT_SELECTED');
  }

  if (req.user.roleCode !== 'ADMIN') {
    return sendError(res, 'Access denied. Admin privileges required', 403, 'FORBIDDEN');
  }

  next();
};

// Alias for authMiddleware
const authenticate = authMiddleware;

module.exports = {
  authMiddleware,
  authenticate,
  roleMiddleware,
  requireRole,
  kycMiddleware,
  requireKyc,
  requireAdmin,
};
