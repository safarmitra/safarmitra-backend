const userService = require('../services/userService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * GET /users/me
 * Get current user profile
 */
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const profile = await userService.getProfile(userId);

    return sendSuccess(res, profile, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /users/me
 * Update current user profile (only city and area)
 * Note: Only city and area fields can be updated. All other fields are silently ignored.
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await userService.updateProfile(userId, req.body);

    return sendSuccess(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/profile/:id
 * Get public user profile by ID
 */
const getProfileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await userService.getPublicProfile(id);

    return sendSuccess(res, profile, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/drivers
 * List verified drivers (for operators to invite)
 */
const listDrivers = async (req, res, next) => {
  try {
    const result = await userService.listDrivers(req.query);

    return res.status(200).json({
      success: true,
      message: 'Drivers fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getProfileById,
  listDrivers,
};
