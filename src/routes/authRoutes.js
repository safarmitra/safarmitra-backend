const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { validateLogin, validateSelectRole } = require('../validators/authValidator');

// Public routes (use Firebase token)
router.post('/login', validateLogin, authController.login);

// Onboarding routes (use Firebase token, not JWT)
// User doesn't have JWT until KYC is approved
router.post('/select-role', validateSelectRole, authController.selectRole);

// Protected routes (require JWT - only for verified users)
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
