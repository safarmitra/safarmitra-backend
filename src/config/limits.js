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
};
