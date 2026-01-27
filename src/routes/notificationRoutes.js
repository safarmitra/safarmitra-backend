'use strict';

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  validateListNotifications,
  validateNotificationId,
} = require('../validators/notificationValidator');

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /notifications
 * @desc    Get user's notifications (paginated)
 * @access  Authenticated users
 */
router.get('/', validateListNotifications, notificationController.getNotifications);

/**
 * @route   GET /notifications/unread-count
 * @desc    Get unread notification count
 * @access  Authenticated users
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   PUT /notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Authenticated users
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route   PUT /notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Authenticated users
 */
router.put('/:id/read', validateNotificationId, notificationController.markAsRead);

module.exports = router;
