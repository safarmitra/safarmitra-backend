'use strict';

const { admin } = require('../config/firebase');
const { User, Notification } = require('../models');
const templates = require('../utils/notificationTemplates');

/**
 * Notification Service
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 * and storing notification history in the database
 */

/**
 * Save notification to database
 * @param {number} userId - User ID
 * @param {Object} template - Notification template { title, body, data }
 * @param {boolean} fcmSent - Whether FCM was sent successfully
 * @param {string|null} fcmResponse - FCM response or error message
 * @returns {Promise<Object>} Created notification record
 */
const saveNotification = async (userId, template, fcmSent = false, fcmResponse = null) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type: template.data?.type || 'GENERAL',
      title: template.title,
      body: template.body,
      data: template.data || {},
      is_read: false,
      fcm_sent: fcmSent,
      fcm_response: fcmResponse,
    });
    return notification;
  } catch (error) {
    console.error('Error saving notification to database:', error.message);
    return null;
  }
};

/**
 * Send a push notification via FCM
 * @param {string} fcmToken - User's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} { success: boolean, response: string|null }
 */
const sendFcmNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.log('No FCM token provided, skipping FCM notification');
    return { success: false, response: 'No FCM token' };
  }

  if (!admin) {
    console.log('Firebase not initialized, skipping FCM notification');
    return { success: false, response: 'Firebase not initialized' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        // Ensure all values are strings (FCM requirement)
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'safarmitra_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ FCM notification sent successfully: ${response}`);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error.message);

    // If token is invalid, we might want to clear it from the database
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      console.log('Invalid FCM token, should be cleared from database');
    }

    return { success: false, response: error.message };
  }
};

/**
 * Send notification to a user by their ID (saves to DB + sends FCM)
 * @param {number} userId - User ID
 * @param {Object} template - Notification template { title, body, data }
 * @returns {Promise<Object|null>} Created notification record
 */
const sendToUser = async (userId, template) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'fcm_token', 'full_name'],
    });

    if (!user) {
      console.log(`User ${userId} not found, skipping notification`);
      return null;
    }

    // Send FCM notification
    const fcmResult = await sendFcmNotification(
      user.fcm_token,
      template.title,
      template.body,
      template.data
    );

    // Save notification to database
    const notification = await saveNotification(
      userId,
      template,
      fcmResult.success,
      fcmResult.response
    );

    return notification;
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error.message);
    return null;
  }
};

/**
 * Send notification to multiple users
 * @param {number[]} userIds - Array of user IDs
 * @param {Object} template - Notification template { title, body, data }
 * @returns {Promise<Object[]>}
 */
const sendToUsers = async (userIds, template) => {
  const results = await Promise.all(userIds.map((userId) => sendToUser(userId, template)));
  return results;
};

/**
 * Get user's notifications (paginated)
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  const { page = 1, limit = 20, type = null } = options;
  const offset = (page - 1) * limit;

  const where = { user_id: userId };
  if (type) {
    where.type = type;
  }

  const { count, rows } = await Notification.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  // Get unread count
  const unreadCount = await Notification.count({
    where: { user_id: userId, is_read: false },
  });

  return {
    data: rows.map((n) => ({
      id: n.id.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      is_read: n.is_read,
      created_at: n.created_at,
    })),
    meta: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
      unread_count: unreadCount,
    },
  };
};

/**
 * Get unread notification count for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>}
 */
const getUnreadCount = async (userId) => {
  return Notification.count({
    where: { user_id: userId, is_read: false },
  });
};

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for ownership verification)
 * @returns {Promise<Object|null>}
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });

  if (!notification) {
    return null;
  }

  notification.is_read = true;
  await notification.save();

  return {
    id: notification.id.toString(),
    is_read: notification.is_read,
  };
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
const markAllAsRead = async (userId) => {
  const [updatedCount] = await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } }
  );
  return updatedCount;
};

// ==================== Booking Request Notifications ====================

/**
 * Notify operator when driver creates a booking request
 */
const notifyBookingRequestCreated = async (operatorId, driverName, carName, requestId, carId) => {
  const template = templates.bookingRequestCreated(driverName, carName, requestId, carId);
  return sendToUser(operatorId, template);
};

/**
 * Notify driver when operator sends an invitation
 */
const notifyBookingInvitationCreated = async (driverId, operatorName, carName, requestId, carId) => {
  const template = templates.bookingInvitationCreated(operatorName, carName, requestId, carId);
  return sendToUser(driverId, template);
};

/**
 * Notify driver when operator accepts their request
 */
const notifyBookingRequestAccepted = async (driverId, operatorName, carName, requestId, carId) => {
  const template = templates.bookingRequestAccepted(operatorName, carName, requestId, carId);
  return sendToUser(driverId, template);
};

/**
 * Notify driver when operator rejects their request
 */
const notifyBookingRequestRejected = async (
  driverId,
  operatorName,
  carName,
  requestId,
  carId,
  reason = null
) => {
  const template = templates.bookingRequestRejected(operatorName, carName, requestId, carId, reason);
  return sendToUser(driverId, template);
};

/**
 * Notify operator when driver accepts their invitation
 */
const notifyBookingInvitationAccepted = async (operatorId, driverName, carName, requestId, carId) => {
  const template = templates.bookingInvitationAccepted(driverName, carName, requestId, carId);
  return sendToUser(operatorId, template);
};

/**
 * Notify operator when driver rejects their invitation
 */
const notifyBookingInvitationRejected = async (
  operatorId,
  driverName,
  carName,
  requestId,
  carId,
  reason = null
) => {
  const template = templates.bookingInvitationRejected(driverName, carName, requestId, carId, reason);
  return sendToUser(operatorId, template);
};

/**
 * Notify operator when driver cancels their request
 */
const notifyBookingRequestCancelled = async (operatorId, driverName, carName, carId) => {
  const template = templates.bookingRequestCancelled(driverName, carName, carId);
  return sendToUser(operatorId, template);
};

/**
 * Notify driver when operator cancels their invitation
 */
const notifyBookingInvitationCancelled = async (driverId, operatorName, carName, carId) => {
  const template = templates.bookingInvitationCancelled(operatorName, carName, carId);
  return sendToUser(driverId, template);
};

// ==================== Limit Notifications ====================

/**
 * Notify user when daily limit is reached
 */
const notifyDailyLimitReached = async (userId, limit, roleCode) => {
  const template = templates.dailyLimitReached(limit, roleCode);
  return sendToUser(userId, template);
};

// ==================== KYC Notifications ====================

/**
 * Notify user when KYC is approved
 */
const notifyKycApproved = async (userId) => {
  const template = templates.kycApproved();
  return sendToUser(userId, template);
};

/**
 * Notify user when KYC is rejected
 */
const notifyKycRejected = async (userId, reason = null) => {
  const template = templates.kycRejected(reason);
  return sendToUser(userId, template);
};

/**
 * Notify user when a document is approved
 */
const notifyDocumentApproved = async (userId, documentType) => {
  const template = templates.documentApproved(documentType);
  return sendToUser(userId, template);
};

/**
 * Notify user when a document is rejected
 */
const notifyDocumentRejected = async (userId, documentType, reason = null) => {
  const template = templates.documentRejected(documentType, reason);
  return sendToUser(userId, template);
};

// ==================== Account Notifications ====================

/**
 * Notify user when account is suspended
 */
const notifyAccountSuspended = async (userId) => {
  const template = templates.accountSuspended();
  return sendToUser(userId, template);
};

/**
 * Notify user when account is activated
 */
const notifyAccountActivated = async (userId) => {
  const template = templates.accountActivated();
  return sendToUser(userId, template);
};

module.exports = {
  // Core functions
  sendToUser,
  sendToUsers,
  saveNotification,

  // Notification history functions
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,

  // Booking request notifications
  notifyBookingRequestCreated,
  notifyBookingInvitationCreated,
  notifyBookingRequestAccepted,
  notifyBookingRequestRejected,
  notifyBookingInvitationAccepted,
  notifyBookingInvitationRejected,
  notifyBookingRequestCancelled,
  notifyBookingInvitationCancelled,

  // Limit notifications
  notifyDailyLimitReached,

  // KYC notifications
  notifyKycApproved,
  notifyKycRejected,
  notifyDocumentApproved,
  notifyDocumentRejected,

  // Account notifications
  notifyAccountSuspended,
  notifyAccountActivated,
};
