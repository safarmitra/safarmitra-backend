'use strict';

const adminService = require('../services/adminService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Get dashboard statistics
 * GET /admin/dashboard/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, stats, 'Dashboard stats fetched successfully');
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * List all users
 * GET /admin/users
 */
const listUsers = async (req, res) => {
  try {
    const result = await adminService.listUsers(req.query);
    return sendSuccess(res, result.data, 'Users fetched successfully', result.meta);
  } catch (err) {
    console.error('List users error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * Get user by ID
 * GET /admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    return sendSuccess(res, user, 'User fetched successfully');
  } catch (err) {
    console.error('Get user error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * Update user status (suspend/activate)
 * PUT /admin/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const result = await adminService.updateUserStatus(req.params.id, req.body);
    const message = result.is_active ? 'User activated successfully' : 'User suspended successfully';
    return sendSuccess(res, result, message);
  } catch (err) {
    console.error('Update user status error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * List users with pending KYC
 * GET /admin/kyc/pending
 */
const listPendingKyc = async (req, res) => {
  try {
    const result = await adminService.listPendingKyc(req.query);
    return sendSuccess(res, result.data, 'Pending KYC users fetched successfully', result.meta);
  } catch (err) {
    console.error('List pending KYC error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * Update user KYC status
 * PUT /admin/users/:id/kyc
 */
const updateUserKycStatus = async (req, res) => {
  try {
    const result = await adminService.updateUserKycStatus(req.params.id, req.body);
    const message =
      result.kyc_status === 'APPROVED' ? 'KYC approved successfully' : 'KYC rejected successfully';
    return sendSuccess(res, result, message);
  } catch (err) {
    console.error('Update KYC status error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * Update document status
 * PUT /admin/documents/:id/status
 */
const updateDocumentStatus = async (req, res) => {
  try {
    const result = await adminService.updateDocumentStatus(req.params.id, req.body);
    const message =
      result.status === 'APPROVED' ? 'Document approved successfully' : 'Document rejected successfully';
    return sendSuccess(res, result, message);
  } catch (err) {
    console.error('Update document status error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * List all cars
 * GET /admin/cars
 */
const listCars = async (req, res) => {
  try {
    const result = await adminService.listCars(req.query);
    return sendSuccess(res, result.data, 'Cars fetched successfully', result.meta);
  } catch (err) {
    console.error('List cars error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * Get car by ID
 * GET /admin/cars/:id
 */
const getCarById = async (req, res) => {
  try {
    const car = await adminService.getCarById(req.params.id);
    return sendSuccess(res, car, 'Car fetched successfully');
  } catch (err) {
    console.error('Get car error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * Delete car
 * DELETE /admin/cars/:id
 */
const deleteCar = async (req, res) => {
  try {
    await adminService.deleteCar(req.params.id);
    return sendSuccess(res, null, 'Car deleted successfully');
  } catch (err) {
    console.error('Delete car error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * List all booking requests
 * GET /admin/booking-requests
 */
const listBookingRequests = async (req, res) => {
  try {
    const result = await adminService.listBookingRequests(req.query);
    return sendSuccess(res, result.data, 'Booking requests fetched successfully', result.meta);
  } catch (err) {
    console.error('List booking requests error:', err);
    return sendError(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  getDashboardStats,
  listUsers,
  getUserById,
  updateUserStatus,
  listPendingKyc,
  updateUserKycStatus,
  updateDocumentStatus,
  listCars,
  getCarById,
  deleteCar,
  listBookingRequests,
};
