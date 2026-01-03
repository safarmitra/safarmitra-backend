const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { validateLogin, validateSelectRole } = require('../validators/authValidator');

// Public routes
router.post('/login', validateLogin, authController.login);

// Protected routes
router.post('/select-role', authMiddleware, validateSelectRole, authController.selectRole);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
