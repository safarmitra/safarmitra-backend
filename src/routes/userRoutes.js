const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, requireRole, requireKyc } = require('../middlewares/authMiddleware');
const { validateUpdateProfile, validateListDrivers } = require('../validators/userValidator');

// All routes require authentication
router.use(authMiddleware);

// GET /users/me - Get current user profile
router.get('/me', userController.getMyProfile);

// PUT /users/me - Update current user profile (only city and area)
router.put(
  '/me',
  validateUpdateProfile,
  userController.updateMyProfile
);

// GET /users/profile/:id - Get public user profile by ID
router.get('/profile/:id', userController.getProfileById);

// GET /users/drivers - List verified drivers (for operators to invite)
router.get(
  '/drivers',
  requireKyc,
  requireRole('OPERATOR'),
  validateListDrivers,
  userController.listDrivers
);

module.exports = router;
