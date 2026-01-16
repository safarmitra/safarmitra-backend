'use strict';

const bookingRequestService = require('../services/bookingRequestService');
const { success, error } = require('../utils/responseHelper');

/**
 * Create a new booking request (Driver requesting a car)
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
 * Invite a driver for a car (Operator inviting a driver)
 * POST /booking-requests/invite
 */
const inviteDriver = async (req, res) => {
  try {
    const operatorId = req.user.userId;
    const result = await bookingRequestService.inviteDriver(req.body, operatorId);

    return success(res, 'Driver invited successfully', result, 201);
  } catch (err) {
    console.error('Invite driver error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * List sent booking requests (requests I created)
 * GET /booking-requests/sent
 */
const listSentRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const roleCode = req.user.roleCode;
    const result = await bookingRequestService.listSentRequests(req.query, userId, roleCode);

    return res.status(200).json({
      success: true,
      message: 'Sent requests fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    console.error('List sent requests error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * List received booking requests (requests sent to me)
 * GET /booking-requests/received
 */
const listReceivedRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const roleCode = req.user.roleCode;
    const result = await bookingRequestService.listReceivedRequests(req.query, userId, roleCode);

    return res.status(200).json({
      success: true,
      message: 'Received requests fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    console.error('List received requests error:', err);
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
    const userId = req.user.userId;
    const roleCode = req.user.roleCode;
    const result = await bookingRequestService.updateBookingRequestStatus(requestId, req.body, userId, roleCode);

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
    const userId = req.user.userId;
    const roleCode = req.user.roleCode;
    await bookingRequestService.cancelBookingRequest(requestId, userId, roleCode);

    return success(res, 'Booking request cancelled successfully');
  } catch (err) {
    console.error('Cancel booking request error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * Get request counts for dashboard
 * GET /booking-requests/counts
 */
const getRequestCounts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const roleCode = req.user.roleCode;
    const counts = await bookingRequestService.getRequestCounts(userId, roleCode);

    return success(res, 'Request counts fetched successfully', counts);
  } catch (err) {
    console.error('Get request counts error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

/**
 * Get pending request count for current driver (Legacy - kept for backward compatibility)
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
  inviteDriver,
  listSentRequests,
  listReceivedRequests,
  updateBookingRequestStatus,
  cancelBookingRequest,
  getRequestCounts,
  getPendingRequestCount,
};
