'use strict';

/**
 * Request Limits Configuration
 * These values can be overridden via environment variables
 */
module.exports = {
  // Maximum number of booking requests a driver can send per day
  DRIVER_DAILY_REQUEST_LIMIT: parseInt(process.env.DRIVER_DAILY_REQUEST_LIMIT) || 5,

  // Maximum number of invitations an operator can send per day
  OPERATOR_DAILY_INVITATION_LIMIT: parseInt(process.env.OPERATOR_DAILY_INVITATION_LIMIT) || 5,

  // Number of days after which a pending booking request expires
  BOOKING_REQUEST_EXPIRY_DAYS: parseInt(process.env.BOOKING_REQUEST_EXPIRY_DAYS) || 3,

  // Number of days of inactivity after which a car is auto-deactivated
  CAR_INACTIVITY_DAYS: parseInt(process.env.CAR_INACTIVITY_DAYS) || 7,

  // Number of days to retain notifications (older ones are cleaned up)
  NOTIFICATION_RETENTION_DAYS: parseInt(process.env.NOTIFICATION_RETENTION_DAYS) || 7,
};
