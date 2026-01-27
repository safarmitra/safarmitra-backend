'use strict';

const notificationService = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Get user's notifications (paginated)
 * GET /notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
    });

    return sendSuccess(res, result.data, 'Notifications fetched successfully', result.meta);
  } catch (err) {
    console.error('Get notifications error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * Get unread notification count
 * GET /notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const unreadCount = await notificationService.getUnreadCount(userId);

    return sendSuccess(res, { unread_count: unreadCount }, 'Unread count fetched successfully');
  } catch (err) {
    console.error('Get unread count error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * Mark a notification as read
 * PUT /notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;

    const result = await notificationService.markAsRead(notificationId, userId);

    if (!result) {
      return sendError(res, 'Notification not found', 404);
    }

    return sendSuccess(res, result, 'Notification marked as read');
  } catch (err) {
    console.error('Mark as read error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * Mark all notifications as read
 * PUT /notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updatedCount = await notificationService.markAllAsRead(userId);

    return sendSuccess(
      res,
      { updated_count: updatedCount },
      `${updatedCount} notifications marked as read`
    );
  } catch (err) {
    console.error('Mark all as read error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
