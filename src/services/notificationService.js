'use strict';

const { admin } = require('../config/firebase');
const { User } = require('../models');
const templates = require('../utils/notificationTemplates');

/**
 * Notification Service
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 */

/**
 * Send a push notification to a user
 * @param {string} fcmToken - User's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object|null>} FCM response or null if failed
 */
const sendNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.log('No FCM token provided, skipping notification');
    return null;
  }

  if (!admin) {
    console.log('Firebase not initialized, skipping notification');
    return null;
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
    console.log(`✅ Notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    
    // If token is invalid, we might want to clear it from the database
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.log('Invalid FCM token, should be cleared from database');
    }
    
    return null;
  }
};

/**
 * Send notification to a user by their ID
 * @param {number} userId - User ID
 * @param {Object} template - Notification template { title, body, data }
 * @returns {Promise<Object|null>}
 */
const sendToUser = async (userId, template) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'fcm_token', 'full_name'],
    });

    if (!user || !user.fcm_token) {
      console.log(`User ${userId} has no FCM token, skipping notification`);
      return null;
    }

    return sendNotification(user.fcm_token, template.title, template.body, template.data);
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
  const results = await Promise.all(
    userIds.map((userId) => sendToUser(userId, template))
  );
  return results;
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
const notifyBookingRequestRejected = async (driverId, operatorName, carName, requestId, carId, reason = null) => {
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
const notifyBookingInvitationRejected = async (operatorId, driverName, carName, requestId, carId, reason = null) => {
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
  sendNotification,
  sendToUser,
  sendToUsers,

  // Booking request notifications
  notifyBookingRequestCreated,
  notifyBookingInvitationCreated,
  notifyBookingRequestAccepted,
  notifyBookingRequestRejected,
  notifyBookingInvitationAccepted,
  notifyBookingInvitationRejected,
  notifyBookingRequestCancelled,
  notifyBookingInvitationCancelled,

  // KYC notifications
  notifyKycApproved,
  notifyKycRejected,
  notifyDocumentApproved,
  notifyDocumentRejected,

  // Account notifications
  notifyAccountSuspended,
  notifyAccountActivated,
};
