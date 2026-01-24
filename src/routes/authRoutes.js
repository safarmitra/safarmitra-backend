const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, requireAdmin } = require('../middlewares/authMiddleware');
const { 
  validateLogin, 
  validateSelectRole, 
  validateAdminLogin, 
  validateChangePassword 
} = require('../validators/authValidator');

// ==================== User Auth Routes ====================

// Public routes (use Firebase token)
router.post('/login', validateLogin, authController.login);

// Onboarding routes (use Firebase token, not JWT)
// User doesn't have JWT until KYC is approved
router.post('/select-role', validateSelectRole, authController.selectRole);

// Protected routes (require JWT - only for verified users)
router.post('/logout', authMiddleware, authController.logout);

// ==================== Admin Auth Routes ====================

/**
 * @route   POST /auth/admin/login
 * @desc    Admin login with email and password
 * @access  Public
 */
router.post('/admin/login', validateAdminLogin, authController.adminLogin);

/**
 * @route   PUT /auth/admin/change-password
 * @desc    Change admin password
 * @access  Admin only
 */
router.put(
  '/admin/change-password', 
  authMiddleware, 
  requireAdmin, 
  validateChangePassword, 
  authController.changeAdminPassword
);

module.exports = router;
