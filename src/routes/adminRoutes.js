'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');
const {
  validateListUsers,
  validateUpdateUserStatus,
  validateUpdateKycStatus,
  validateUpdateDocumentStatus,
  validateListCars,
  validateListBookingRequests,
  validateListPendingKyc,
} = require('../validators/adminValidator');

/**
 * All admin routes require authentication and admin role
 */
router.use(authenticate);
router.use(requireAdmin);

// ==================== Dashboard ====================

/**
 * @route   GET /admin/dashboard/stats
 * @desc    Get platform statistics
 * @access  Admin only
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

// ==================== User Management ====================

/**
 * @route   GET /admin/users
 * @desc    List all users with filters
 * @access  Admin only
 */
router.get('/users', validateListUsers, adminController.listUsers);

/**
 * @route   GET /admin/users/:id
 * @desc    Get user details by ID
 * @access  Admin only
 */
router.get('/users/:id', adminController.getUserById);

/**
 * @route   PUT /admin/users/:id/status
 * @desc    Suspend or activate user
 * @access  Admin only
 */
router.put('/users/:id/status', validateUpdateUserStatus, adminController.updateUserStatus);

// ==================== KYC Management ====================

/**
 * @route   GET /admin/kyc/pending
 * @desc    List users with pending KYC
 * @access  Admin only
 */
router.get('/kyc/pending', validateListPendingKyc, adminController.listPendingKyc);

/**
 * @route   PUT /admin/users/:id/kyc
 * @desc    Approve or reject user KYC
 * @access  Admin only
 */
router.put('/users/:id/kyc', validateUpdateKycStatus, adminController.updateUserKycStatus);

/**
 * @route   PUT /admin/documents/:id/status
 * @desc    Approve or reject individual document
 * @access  Admin only
 */
router.put('/documents/:id/status', validateUpdateDocumentStatus, adminController.updateDocumentStatus);

// ==================== Car Management ====================

/**
 * @route   GET /admin/cars
 * @desc    List all cars with filters
 * @access  Admin only
 */
router.get('/cars', validateListCars, adminController.listCars);

/**
 * @route   GET /admin/cars/:id
 * @desc    Get car details by ID
 * @access  Admin only
 */
router.get('/cars/:id', adminController.getCarById);

/**
 * @route   DELETE /admin/cars/:id
 * @desc    Delete car listing
 * @access  Admin only
 */
router.delete('/cars/:id', adminController.deleteCar);

// ==================== Booking Requests ====================

/**
 * @route   GET /admin/booking-requests
 * @desc    List all booking requests
 * @access  Admin only
 */
router.get('/booking-requests', validateListBookingRequests, adminController.listBookingRequests);

module.exports = router;
