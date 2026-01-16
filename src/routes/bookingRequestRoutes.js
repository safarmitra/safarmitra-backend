'use strict';

const express = require('express');
const router = express.Router();
const bookingRequestController = require('../controllers/bookingRequestController');
const { authenticate, requireRole, requireKyc } = require('../middlewares/authMiddleware');
const {
  validateCreateBookingRequest,
  validateInviteDriver,
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
 * @desc    Create a new booking request (Driver requesting a car)
 * @access  DRIVER only
 */
router.post(
  '/',
  requireRole('DRIVER'),
  validateCreateBookingRequest,
  bookingRequestController.createBookingRequest
);

/**
 * @route   POST /booking-requests/invite
 * @desc    Invite a driver for a car (Operator inviting a driver)
 * @access  OPERATOR only
 */
router.post(
  '/invite',
  requireRole('OPERATOR'),
  validateInviteDriver,
  bookingRequestController.inviteDriver
);

/**
 * @route   GET /booking-requests/sent
 * @desc    List sent booking requests (requests I created)
 * @access  DRIVER and OPERATOR
 */
router.get(
  '/sent',
  validateListBookingRequests,
  bookingRequestController.listSentRequests
);

/**
 * @route   GET /booking-requests/received
 * @desc    List received booking requests (requests sent to me)
 * @access  DRIVER and OPERATOR
 */
router.get(
  '/received',
  validateListBookingRequests,
  bookingRequestController.listReceivedRequests
);

/**
 * @route   GET /booking-requests/counts
 * @desc    Get request counts for dashboard
 * @access  DRIVER and OPERATOR
 */
router.get(
  '/counts',
  bookingRequestController.getRequestCounts
);

/**
 * @route   GET /booking-requests/pending-count
 * @desc    Get pending request count for driver (Legacy)
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
 * @access  DRIVER and OPERATOR (receiver of the request)
 */
router.put(
  '/:id/status',
  validateUpdateStatus,
  bookingRequestController.updateBookingRequestStatus
);

/**
 * @route   DELETE /booking-requests/:id
 * @desc    Cancel a pending booking request
 * @access  DRIVER and OPERATOR (initiator of the request)
 */
router.delete(
  '/:id',
  bookingRequestController.cancelBookingRequest
);

module.exports = router;
