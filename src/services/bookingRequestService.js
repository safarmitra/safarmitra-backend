'use strict';

const { BookingRequest, Car, CarImage, User, Role } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('./notificationService');

/**
 * Create a new booking request (Driver requesting a car)
 * @param {Object} data - Request data
 * @param {number} driverId - Driver's user ID
 * @returns {Promise<Object>} Created booking request with full details
 */
const createBookingRequest = async (data, driverId) => {
  const { car_id, message } = data;

  // Find the driver
  const driver = await User.findByPk(driverId, {
    attributes: ['id', 'full_name'],
  });

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

  // Check for existing pending request for the same car by the same driver (initiated by driver)
  const existingRequest = await BookingRequest.findOne({
    where: {
      car_id,
      driver_id: driverId,
      initiated_by: 'DRIVER',
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
    initiated_by: 'DRIVER',
    message: message || null,
    status: 'PENDING',
  });

  // Send notification to operator
  notificationService.notifyBookingRequestCreated(
    car.operator_id,
    driver.full_name || 'A driver',
    car.car_name,
    bookingRequest.id,
    car.id
  ).catch((err) => console.error('Notification error:', err));

  // Fetch the created request with full details
  return getBookingRequestById(bookingRequest.id, driverId, 'DRIVER');
};

/**
 * Create an invitation (Operator inviting a driver for a car)
 * @param {Object} data - Request data
 * @param {number} operatorId - Operator's user ID
 * @returns {Promise<Object>} Created booking request with full details
 */
const inviteDriver = async (data, operatorId) => {
  const { car_id, driver_id, message } = data;

  // Find the operator
  const operator = await User.findByPk(operatorId, {
    attributes: ['id', 'full_name', 'agency_name'],
  });

  // Find the car
  const car = await Car.findByPk(car_id, {
    include: [
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

  // Check if operator owns this car
  if (car.operator_id.toString() !== operatorId.toString()) {
    const error = new Error('You can only invite drivers for your own cars');
    error.statusCode = 403;
    throw error;
  }

  // Check if car is active
  if (!car.is_active) {
    const error = new Error('Car must be active to invite drivers');
    error.statusCode = 400;
    throw error;
  }

  // Find the driver
  const driver = await User.findByPk(driver_id, {
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['code'],
      },
    ],
  });

  if (!driver) {
    const error = new Error('Driver not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if user is a driver
  if (!driver.role || driver.role.code !== 'DRIVER') {
    const error = new Error('User is not a driver');
    error.statusCode = 400;
    throw error;
  }

  // Check if driver's KYC is approved
  if (driver.kyc_status !== 'APPROVED') {
    const error = new Error('Driver KYC is not approved');
    error.statusCode = 400;
    throw error;
  }

  // Check if operator is trying to invite themselves
  if (driver_id.toString() === operatorId.toString()) {
    const error = new Error('You cannot invite yourself');
    error.statusCode = 400;
    throw error;
  }

  // Check for existing pending invitation for the same car to the same driver (initiated by operator)
  const existingInvitation = await BookingRequest.findOne({
    where: {
      car_id,
      driver_id,
      initiated_by: 'OPERATOR',
      status: 'PENDING',
    },
  });

  if (existingInvitation) {
    const error = new Error('You already have a pending invitation for this driver');
    error.statusCode = 400;
    throw error;
  }

  // Create the booking request (invitation)
  const bookingRequest = await BookingRequest.create({
    car_id,
    driver_id,
    operator_id: operatorId,
    initiated_by: 'OPERATOR',
    message: message || null,
    status: 'PENDING',
  });

  // Send notification to driver
  notificationService.notifyBookingInvitationCreated(
    driver_id,
    operator.agency_name || operator.full_name || 'An operator',
    car.car_name,
    bookingRequest.id,
    car.id
  ).catch((err) => console.error('Notification error:', err));

  // Fetch the created request with full details
  return getBookingRequestById(bookingRequest.id, operatorId, 'OPERATOR');
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

  // Check access permission - user must be either driver or operator of this request
  const isDriver = bookingRequest.driver_id.toString() === userId.toString();
  const isOperator = bookingRequest.operator_id.toString() === userId.toString();

  if (!isDriver && !isOperator) {
    const error = new Error('You do not have permission to view this request');
    error.statusCode = 403;
    throw error;
  }

  return formatBookingRequest(bookingRequest, roleCode);
};

/**
 * List sent booking requests (requests I created)
 * @param {Object} filters - Filter options
 * @param {number} userId - Current user ID
 * @param {string} roleCode - User's role code
 * @returns {Promise<Object>} Paginated list of booking requests
 */
const listSentRequests = async (filters, userId, roleCode) => {
  const { status, car_id, page, limit } = filters;
  const offset = (page - 1) * limit;

  // Build where clause
  const where = {};

  // For DRIVER: sent requests are initiated_by = DRIVER and driver_id = userId
  // For OPERATOR: sent requests are initiated_by = OPERATOR and operator_id = userId
  if (roleCode === 'DRIVER') {
    where.driver_id = userId;
    where.initiated_by = 'DRIVER';
  } else if (roleCode === 'OPERATOR') {
    where.operator_id = userId;
    where.initiated_by = 'OPERATOR';
  }

  // Status filter
  if (status && status !== 'ALL') {
    where.status = status;
  }

  // Car filter
  if (car_id) {
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
 * List received booking requests (requests sent to me)
 * @param {Object} filters - Filter options
 * @param {number} userId - Current user ID
 * @param {string} roleCode - User's role code
 * @returns {Promise<Object>} Paginated list of booking requests
 */
const listReceivedRequests = async (filters, userId, roleCode) => {
  const { status, car_id, page, limit } = filters;
  const offset = (page - 1) * limit;

  // Build where clause
  const where = {};

  // For DRIVER: received requests are initiated_by = OPERATOR and driver_id = userId
  // For OPERATOR: received requests are initiated_by = DRIVER and operator_id = userId
  if (roleCode === 'DRIVER') {
    where.driver_id = userId;
    where.initiated_by = 'OPERATOR';
  } else if (roleCode === 'OPERATOR') {
    where.operator_id = userId;
    where.initiated_by = 'DRIVER';
  }

  // Status filter
  if (status && status !== 'ALL') {
    where.status = status;
  }

  // Car filter
  if (car_id) {
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
 * Only the receiver of the request can update status
 * @param {number} requestId - Booking request ID
 * @param {Object} data - Status update data
 * @param {number} userId - Current user ID
 * @param {string} roleCode - User's role code
 * @returns {Promise<Object>} Updated booking request
 */
const updateBookingRequestStatus = async (requestId, data, userId, roleCode) => {
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

  // Check if user is the receiver of this request
  // If initiated_by = DRIVER, then OPERATOR is the receiver
  // If initiated_by = OPERATOR, then DRIVER is the receiver
  let isReceiver = false;
  if (bookingRequest.initiated_by === 'DRIVER' && roleCode === 'OPERATOR') {
    isReceiver = bookingRequest.operator_id.toString() === userId.toString();
  } else if (bookingRequest.initiated_by === 'OPERATOR' && roleCode === 'DRIVER') {
    isReceiver = bookingRequest.driver_id.toString() === userId.toString();
  }

  if (!isReceiver) {
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

  // Send notification to the initiator
  const car = bookingRequest.car;
  const driver = bookingRequest.driver;
  const operator = bookingRequest.requestOperator;

  if (bookingRequest.initiated_by === 'DRIVER') {
    // Operator is responding to driver's request
    if (status === 'ACCEPTED') {
      notificationService.notifyBookingRequestAccepted(
        driver.id,
        operator.agency_name || operator.full_name || 'The operator',
        car.car_name,
        bookingRequest.id,
        car.id
      ).catch((err) => console.error('Notification error:', err));
    } else {
      notificationService.notifyBookingRequestRejected(
        driver.id,
        operator.agency_name || operator.full_name || 'The operator',
        car.car_name,
        bookingRequest.id,
        car.id,
        reject_reason
      ).catch((err) => console.error('Notification error:', err));
    }
  } else {
    // Driver is responding to operator's invitation
    if (status === 'ACCEPTED') {
      notificationService.notifyBookingInvitationAccepted(
        operator.id,
        driver.full_name || 'The driver',
        car.car_name,
        bookingRequest.id,
        car.id
      ).catch((err) => console.error('Notification error:', err));
    } else {
      notificationService.notifyBookingInvitationRejected(
        operator.id,
        driver.full_name || 'The driver',
        car.car_name,
        bookingRequest.id,
        car.id,
        reject_reason
      ).catch((err) => console.error('Notification error:', err));
    }
  }

  return formatBookingRequest(bookingRequest, roleCode);
};

/**
 * Cancel a booking request (Only the initiator can cancel)
 * @param {number} requestId - Booking request ID
 * @param {number} userId - Current user ID
 * @param {string} roleCode - User's role code
 * @returns {Promise<Object>} Cancelled request info for notification
 */
const cancelBookingRequest = async (requestId, userId, roleCode) => {
  const bookingRequest = await BookingRequest.findByPk(requestId, {
    include: [
      {
        model: Car,
        as: 'car',
        attributes: ['id', 'car_name'],
      },
      {
        model: User,
        as: 'driver',
        attributes: ['id', 'full_name'],
      },
      {
        model: User,
        as: 'requestOperator',
        attributes: ['id', 'full_name', 'agency_name'],
      },
    ],
  });

  if (!bookingRequest) {
    const error = new Error('Booking request not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if user is the initiator of this request
  let isInitiator = false;
  if (bookingRequest.initiated_by === 'DRIVER' && roleCode === 'DRIVER') {
    isInitiator = bookingRequest.driver_id.toString() === userId.toString();
  } else if (bookingRequest.initiated_by === 'OPERATOR' && roleCode === 'OPERATOR') {
    isInitiator = bookingRequest.operator_id.toString() === userId.toString();
  }

  if (!isInitiator) {
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

  // Store info for notification before deleting
  const car = bookingRequest.car;
  const driver = bookingRequest.driver;
  const operator = bookingRequest.requestOperator;
  const initiatedBy = bookingRequest.initiated_by;

  // Delete the request
  await bookingRequest.destroy();

  // Send notification to the receiver
  if (initiatedBy === 'DRIVER') {
    // Driver cancelled their request -> Notify operator
    notificationService.notifyBookingRequestCancelled(
      operator.id,
      driver.full_name || 'A driver',
      car.car_name,
      car.id
    ).catch((err) => console.error('Notification error:', err));
  } else {
    // Operator cancelled their invitation -> Notify driver
    notificationService.notifyBookingInvitationCancelled(
      driver.id,
      operator.agency_name || operator.full_name || 'An operator',
      car.car_name,
      car.id
    ).catch((err) => console.error('Notification error:', err));
  }
};

/**
 * Get request counts for dashboard
 * @param {number} userId - Current user ID
 * @param {string} roleCode - User's role code
 * @returns {Promise<Object>} Counts object
 */
const getRequestCounts = async (userId, roleCode) => {
  // Sent pending count
  const sentWhere = {
    status: 'PENDING',
  };

  // Received pending count
  const receivedWhere = {
    status: 'PENDING',
  };

  if (roleCode === 'DRIVER') {
    sentWhere.driver_id = userId;
    sentWhere.initiated_by = 'DRIVER';

    receivedWhere.driver_id = userId;
    receivedWhere.initiated_by = 'OPERATOR';
  } else if (roleCode === 'OPERATOR') {
    sentWhere.operator_id = userId;
    sentWhere.initiated_by = 'OPERATOR';

    receivedWhere.operator_id = userId;
    receivedWhere.initiated_by = 'DRIVER';
  }

  const [sentPendingCount, receivedPendingCount] = await Promise.all([
    BookingRequest.count({ where: sentWhere }),
    BookingRequest.count({ where: receivedWhere }),
  ]);

  return {
    sent_pending_count: sentPendingCount,
    received_pending_count: receivedPendingCount,
    total_pending_count: sentPendingCount + receivedPendingCount,
  };
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
    initiated_by: bookingRequest.initiated_by,
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
    driver: {
      id: driver.id.toString(),
      full_name: driver.full_name,
      phone_number: driver.phone_number,
      profile_image_url: driver.profile_image_url,
      kyc_verified: driver.kyc_status === 'APPROVED',
    },
    operator: {
      id: operator.id.toString(),
      full_name: operator.full_name,
      agency_name: operator.agency_name,
      phone_number: operator.phone_number,
      profile_image_url: operator.profile_image_url,
      kyc_verified: operator.kyc_status === 'APPROVED',
    },
  };

  return result;
};

/**
 * Get pending request count for a driver (Legacy - kept for backward compatibility)
 * @param {number} driverId - Driver's user ID
 * @returns {Promise<number>} Count of pending requests
 */
const getPendingRequestCount = async (driverId) => {
  return BookingRequest.count({
    where: {
      driver_id: driverId,
      initiated_by: 'DRIVER',
      status: 'PENDING',
    },
  });
};

module.exports = {
  createBookingRequest,
  inviteDriver,
  getBookingRequestById,
  listSentRequests,
  listReceivedRequests,
  updateBookingRequestStatus,
  cancelBookingRequest,
  getRequestCounts,
  getPendingRequestCount,
};
