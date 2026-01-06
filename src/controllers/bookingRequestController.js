'use strict';

const bookingRequestService = require('../services/bookingRequestService');
const { success, error } = require('../utils/responseHelper');

/**
 * Create a new booking request
 * POST /booking-requests
 */
const createBookingRequest = async (req, res) => {
  try {
    const driverId = req.user.userId;
    const result = await bookingRequestService.createBookingRequest(req.body, driverId);

    return success(res, 'Booking request created successfully', result, 201);
  } catch (err) {
    console.error('Create booking request error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * List booking requests
 * GET /booking-requests
 */
const listBookingRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const roleCode = req.user.roleCode;
    const result = await bookingRequestService.listBookingRequests(req.query, userId, roleCode);

    return res.status(200).json({
      success: true,
      message: 'Booking requests fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    console.error('List booking requests error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * Update booking request status (Accept/Reject)
 * PUT /booking-requests/:id/status
 */
const updateBookingRequestStatus = async (req, res) => {
  try {
    const requestId = req.params.id;
    const operatorId = req.user.userId;
    const result = await bookingRequestService.updateBookingRequestStatus(requestId, req.body, operatorId);

    const statusMessage = req.body.status === 'ACCEPTED' ? 'accepted' : 'rejected';
    return success(res, `Booking request ${statusMessage} successfully`, result);
  } catch (err) {
    console.error('Update booking request status error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * Cancel a booking request
 * DELETE /booking-requests/:id
 */
const cancelBookingRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const driverId = req.user.userId;
    await bookingRequestService.cancelBookingRequest(requestId, driverId);

    return success(res, 'Booking request cancelled successfully');
  } catch (err) {
    console.error('Cancel booking request error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * Get pending request count for current driver
 * GET /booking-requests/pending-count
 */
const getPendingRequestCount = async (req, res) => {
  try {
    const driverId = req.user.userId;
    const count = await bookingRequestService.getPendingRequestCount(driverId);

    return success(res, 'Pending request count fetched successfully', { pending_count: count });
  } catch (err) {
    console.error('Get pending request count error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  createBookingRequest,
  listBookingRequests,
  updateBookingRequestStatus,
  cancelBookingRequest,
  getPendingRequestCount,
};
