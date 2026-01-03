const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * POST /auth/login
 * Login or register user with Firebase token
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
 */
const selectRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.user.userId;

    const user = await authService.selectRole(userId, role);

    return sendSuccess(res, { user }, 'Role selected successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 * Logout user and clear FCM token
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
