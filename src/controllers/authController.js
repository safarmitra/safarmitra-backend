const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * POST /auth/login
 * Login or register user with Firebase token
 * 
 * Returns:
 * - token (JWT) if KYC is APPROVED
 * - onboarding_token if KYC is NOT APPROVED
 */
const login = async (req, res, next) => {
  try {
    const { firebase_token, fcm_token } = req.body;

    const result = await authService.loginOrRegister(firebase_token, fcm_token);

    const message = result.isNewUser ? 'Registration successful' : 'Login successful';

    return sendSuccess(
      res,
      {
        token: result.token,
        onboarding_token: result.onboarding_token,
        user: result.user,
        onboarding: result.onboarding,
      },
      message
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/select-role
 * Select user role (DRIVER or OPERATOR)
 * 
 * Uses onboarding_token for authentication
 * Because user doesn't have JWT until KYC is approved
 */
const selectRole = async (req, res, next) => {
  try {
    const { onboarding_token, role } = req.body;

    const result = await authService.selectRole(onboarding_token, role);

    return sendSuccess(res, result, 'Role selected successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 * Logout user and clear FCM token
 * 
 * Requires JWT (only for verified users)
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await authService.logout(userId);

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  selectRole,
  logout,
};
