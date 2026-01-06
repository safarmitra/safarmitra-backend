'use strict';

const express = require('express');
const router = express.Router();
const bookingRequestController = require('../controllers/bookingRequestController');
const { authenticate, requireRole, requireKyc } = require('../middlewares/authMiddleware');
const {
  validateCreateBookingRequest,
  validateUpdateStatus,
  validateListBookingRequests,
} = require('../validators/bookingRequestValidator');

/**
 * All routes require authentication and KYC approval
 */
router.use(authenticate);
router.use(requireKyc);

/**
 * @route   POST /booking-requests
 * @desc    Create a new booking request
 * @access  DRIVER only
 */
router.post(
  '/',
  requireRole('DRIVER'),
  validateCreateBookingRequest,
  bookingRequestController.createBookingRequest
);

/**
 * @route   GET /booking-requests
 * @desc    List booking requests with filters
 * @access  DRIVER and OPERATOR
 */
router.get(
  '/',
  validateListBookingRequests,
  bookingRequestController.listBookingRequests
);

/**
 * @route   GET /booking-requests/pending-count
 * @desc    Get pending request count for driver
 * @access  DRIVER only
 */
router.get(
  '/pending-count',
  requireRole('DRIVER'),
  bookingRequestController.getPendingRequestCount
);

/**
 * @route   PUT /booking-requests/:id/status
 * @desc    Update booking request status (Accept/Reject)
 * @access  OPERATOR only
 */
router.put(
  '/:id/status',
  requireRole('OPERATOR'),
  validateUpdateStatus,
  bookingRequestController.updateBookingRequestStatus
);

/**
 * @route   DELETE /booking-requests/:id
 * @desc    Cancel a pending booking request
 * @access  DRIVER only
 */
router.delete(
  '/:id',
  requireRole('DRIVER'),
  bookingRequestController.cancelBookingRequest
);

module.exports = router;
