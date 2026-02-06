'use strict';

const { BOOKING_REQUEST_EXPIRY_DAYS, CAR_INACTIVITY_DAYS } = require('../config/limits');

/**
 * Expiry Helper Utilities
 * 
 * Provides functions to check and handle expiry for:
 * - Booking requests (expire after 3 days)
 * - Cars (auto-deactivate after 7 days of inactivity)
 */

/**
 * Calculate expiry date for a new booking request
 * @returns {Date} Expiry date (now + BOOKING_REQUEST_EXPIRY_DAYS)
 */
const calculateRequestExpiryDate = () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + BOOKING_REQUEST_EXPIRY_DAYS);
  return expiryDate;
};

/**
 * Check if a booking request has expired
 * @param {Object} request - Booking request object
 * @returns {boolean} True if expired
 */
const isBookingRequestExpired = (request) => {
  if (!request) return false;
  if (request.status !== 'PENDING') return false;
  if (!request.expires_at) return false;
  
  return new Date(request.expires_at) < new Date();
};

/**
 * Check if a car should be auto-deactivated due to inactivity
 * @param {Object} car - Car object
 * @returns {boolean} True if car should be deactivated
 */
const isCarInactive = (car) => {
  if (!car) return false;
  if (!car.is_active) return false;
  if (!car.last_active_at) return false;
  
  const inactivityThreshold = new Date();
  inactivityThreshold.setDate(inactivityThreshold.getDate() - CAR_INACTIVITY_DAYS);
  
  return new Date(car.last_active_at) < inactivityThreshold;
};

/**
 * Get the date threshold for car inactivity
 * @returns {Date} Date before which cars are considered inactive
 */
const getCarInactivityThreshold = () => {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - CAR_INACTIVITY_DAYS);
  return threshold;
};

/**
 * Get the date threshold for notification retention
 * @param {number} days - Number of days to retain (default from config)
 * @returns {Date} Date before which notifications should be cleaned up
 */
const getNotificationRetentionThreshold = (days = 7) => {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  return threshold;
};

module.exports = {
  calculateRequestExpiryDate,
  isBookingRequestExpired,
  isCarInactive,
  getCarInactivityThreshold,
  getNotificationRetentionThreshold,
  BOOKING_REQUEST_EXPIRY_DAYS,
  CAR_INACTIVITY_DAYS,
};
