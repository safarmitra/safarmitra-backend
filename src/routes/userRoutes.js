const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { validateUpdateProfile, validateProfileImage } = require('../validators/userValidator');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// All routes require authentication
router.use(authMiddleware);

// GET /users/me - Get current user profile
router.get('/me', userController.getMyProfile);

// PUT /users/me - Update current user profile (info + image)
router.put(
  '/me',
  upload.single('profile_image'),
  validateProfileImage,
  validateUpdateProfile,
  userController.updateMyProfile
);

// GET /users/profile/:id - Get public user profile by ID
router.get('/profile/:id', userController.getProfileById);

module.exports = router;
