'use strict';

const { BookingRequest, Car, CarImage, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new booking request
 * @param {Object} data - Request data
 * @param {number} driverId - Driver's user ID
 * @returns {Promise<Object>} Created booking request with full details
 */
const createBookingRequest = async (data, driverId) => {
  const { car_id, message } = data;

  // Find the car with operator info
  const car = await Car.findByPk(car_id, {
    include: [
      {
        model: User,
        as: 'operator',
        attributes: ['id', 'full_name', 'agency_name', 'phone_number', 'profile_image_url', 'kyc_status'],
      },
      {
        model: CarImage,
        as: 'images',
        attributes: ['id', 'image_url', 'is_primary'],
      },
    ],
  });

  if (!car) {
    const error = new Error('Car not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if car is active
  if (!car.is_active) {
    const error = new Error('Car is not available for booking');
    error.statusCode = 400;
    throw error;
  }

  // Check if driver is trying to book their own car
  if (car.operator_id.toString() === driverId.toString()) {
    const error = new Error('You cannot book your own car');
    error.statusCode = 400;
    throw error;
  }

  // Check for existing pending request for the same car by the same driver
  const existingRequest = await BookingRequest.findOne({
    where: {
      car_id,
      driver_id: driverId,
      status: 'PENDING',
    },
  });

  if (existingRequest) {
    const error = new Error('You already have a pending request for this car');
    error.statusCode = 400;
    throw error;
  }

  // Create the booking request
  const bookingRequest = await BookingRequest.create({
    car_id,
    driver_id: driverId,
    operator_id: car.operator_id,
    message: message || null,
    status: 'PENDING',
  });

  // Fetch the created request with full details
  return getBookingRequestById(bookingRequest.id, driverId, 'DRIVER');
};

/**
 * Get booking request by ID with full details
 * @param {number} requestId - Booking request ID
 * @param {number} userId - Current user ID
 * @param {string} roleCode - User's role code
 * @returns {Promise<Object>} Booking request with full details
 */
const getBookingRequestById = async (requestId, userId, roleCode) => {
  const bookingRequest = await BookingRequest.findByPk(requestId, {
    include: [
      {
        model: Car,
        as: 'car',
        include: [
          {
            model: CarImage,
            as: 'images',
            attributes: ['id', 'image_url', 'is_primary'],
          },
        ],
      },
      {
        model: User,
        as: 'driver',
        attributes: ['id', 'full_name', 'phone_number', 'profile_image_url', 'kyc_status'],
      },
      {
        model: User,
        as: 'requestOperator',
        attributes: ['id', 'full_name', 'agency_name', 'phone_number', 'profile_image_url', 'kyc_status'],
      },
    ],
  });

  if (!bookingRequest) {
    const error = new Error('Booking request not found');
    error.statusCode = 404;
    throw error;
  }

  // Check access permission
  if (roleCode === 'DRIVER' && bookingRequest.driver_id.toString() !== userId.toString()) {
    const error = new Error('You do not have permission to view this request');
    error.statusCode = 403;
    throw error;
  }

  if (roleCode === 'OPERATOR' && bookingRequest.operator_id.toString() !== userId.toString()) {
    const error = new Error('You do not have permission to view this request');
    error.statusCode = 403;
    throw error;
  }

  return formatBookingRequest(bookingRequest, roleCode);
};

/**
 * List booking requests with filters
 * @param {Object} filters - Filter options
 * @param {number} userId - Current user ID
 * @param {string} roleCode - User's role code
 * @returns {Promise<Object>} Paginated list of booking requests
 */
const listBookingRequests = async (filters, userId, roleCode) => {
  const { status, car_id, page, limit } = filters;
  const offset = (page - 1) * limit;

  // Build where clause
  const where = {};

  // Role-based filtering
  if (roleCode === 'DRIVER') {
    where.driver_id = userId;
  } else if (roleCode === 'OPERATOR') {
    where.operator_id = userId;
  }

  // Status filter
  if (status && status !== 'ALL') {
    where.status = status;
  }

  // Car filter (for operators)
  if (car_id && roleCode === 'OPERATOR') {
    where.car_id = car_id;
  }

  // Fetch booking requests with full details
  const { count, rows } = await BookingRequest.findAndCountAll({
    where,
    include: [
      {
        model: Car,
        as: 'car',
        include: [
          {
            model: CarImage,
            as: 'images',
            attributes: ['id', 'image_url', 'is_primary'],
          },
        ],
      },
      {
        model: User,
        as: 'driver',
        attributes: ['id', 'full_name', 'phone_number', 'profile_image_url', 'kyc_status'],
      },
      {
        model: User,
        as: 'requestOperator',
        attributes: ['id', 'full_name', 'agency_name', 'phone_number', 'profile_image_url', 'kyc_status'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  // Format the results
  const formattedRequests = rows.map((request) => formatBookingRequest(request, roleCode));

  return {
    data: formattedRequests,
    meta: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
};

/**
 * Update booking request status (Accept/Reject)
 * @param {number} requestId - Booking request ID
 * @param {Object} data - Status update data
 * @param {number} operatorId - Operator's user ID
 * @returns {Promise<Object>} Updated booking request
 */
const updateBookingRequestStatus = async (requestId, data, operatorId) => {
  const { status, reject_reason } = data;

  const bookingRequest = await BookingRequest.findByPk(requestId, {
    include: [
      {
        model: Car,
        as: 'car',
        include: [
          {
            model: CarImage,
            as: 'images',
            attributes: ['id', 'image_url', 'is_primary'],
          },
        ],
      },
      {
        model: User,
        as: 'driver',
        attributes: ['id', 'full_name', 'phone_number', 'profile_image_url', 'kyc_status'],
      },
      {
        model: User,
        as: 'requestOperator',
        attributes: ['id', 'full_name', 'agency_name', 'phone_number', 'profile_image_url', 'kyc_status'],
      },
    ],
  });

  if (!bookingRequest) {
    const error = new Error('Booking request not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if operator owns this request
  if (bookingRequest.operator_id.toString() !== operatorId.toString()) {
    const error = new Error('You do not have permission to update this request');
    error.statusCode = 403;
    throw error;
  }

  // Check if request is still pending
  if (bookingRequest.status !== 'PENDING') {
    const error = new Error(`Cannot update request. Current status is ${bookingRequest.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Update the status
  bookingRequest.status = status;
  if (status === 'REJECTED' && reject_reason) {
    bookingRequest.reject_reason = reject_reason;
  }

  await bookingRequest.save();

  return formatBookingRequest(bookingRequest, 'OPERATOR');
};

/**
 * Cancel a booking request (Driver only)
 * @param {number} requestId - Booking request ID
 * @param {number} driverId - Driver's user ID
 * @returns {Promise<void>}
 */
const cancelBookingRequest = async (requestId, driverId) => {
  const bookingRequest = await BookingRequest.findByPk(requestId);

  if (!bookingRequest) {
    const error = new Error('Booking request not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if driver owns this request
  if (bookingRequest.driver_id.toString() !== driverId.toString()) {
    const error = new Error('You do not have permission to cancel this request');
    error.statusCode = 403;
    throw error;
  }

  // Check if request is still pending
  if (bookingRequest.status !== 'PENDING') {
    const error = new Error(`Cannot cancel request. Current status is ${bookingRequest.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Delete the request
  await bookingRequest.destroy();
};

/**
 * Format booking request for response
 * @param {Object} bookingRequest - Booking request model instance
 * @param {string} roleCode - User's role code
 * @returns {Object} Formatted booking request
 */
const formatBookingRequest = (bookingRequest, roleCode) => {
  const car = bookingRequest.car;
  const driver = bookingRequest.driver;
  const operator = bookingRequest.requestOperator;

  // Sort images to put primary first
  const sortedImages = car.images
    ? [...car.images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    : [];

  const result = {
    id: bookingRequest.id.toString(),
    message: bookingRequest.message,
    status: bookingRequest.status,
    reject_reason: bookingRequest.reject_reason,
    created_at: bookingRequest.created_at,
    updated_at: bookingRequest.updated_at,
    car: {
      id: car.id.toString(),
      car_name: car.car_name,
      category: car.category,
      transmission: car.transmission,
      fuel_type: car.fuel_type,
      rate_type: car.rate_type,
      rate_amount: parseFloat(car.rate_amount),
      deposit_amount: car.deposit_amount ? parseFloat(car.deposit_amount) : null,
      purposes: car.purposes || [],
      instructions: car.instructions,
      is_active: car.is_active,
      images: sortedImages.map((img) => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: img.is_primary,
      })),
    },
  };

  // Add operator info for drivers
  if (roleCode === 'DRIVER') {
    result.operator = {
      id: operator.id.toString(),
      full_name: operator.full_name,
      agency_name: operator.agency_name,
      phone_number: operator.phone_number,
      profile_image_url: operator.profile_image_url,
      kyc_verified: operator.kyc_status === 'APPROVED',
    };
  }

  // Add driver info for operators
  if (roleCode === 'OPERATOR') {
    result.driver = {
      id: driver.id.toString(),
      full_name: driver.full_name,
      phone_number: driver.phone_number,
      profile_image_url: driver.profile_image_url,
      kyc_verified: driver.kyc_status === 'APPROVED',
    };
  }

  return result;
};

/**
 * Get pending request count for a driver
 * @param {number} driverId - Driver's user ID
 * @returns {Promise<number>} Count of pending requests
 */
const getPendingRequestCount = async (driverId) => {
  return BookingRequest.count({
    where: {
      driver_id: driverId,
      status: 'PENDING',
    },
  });
};

module.exports = {
  createBookingRequest,
  getBookingRequestById,
  listBookingRequests,
  updateBookingRequestStatus,
  cancelBookingRequest,
  getPendingRequestCount,
};
