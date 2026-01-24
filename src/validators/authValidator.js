const Joi = require('joi');

const loginSchema = Joi.object({
  firebase_token: Joi.string().required().messages({
    'string.empty': 'Firebase token is required',
    'any.required': 'Firebase token is required',
  }),
  fcm_token: Joi.string().allow('', null).messages({
    'string.base': 'FCM token must be a string',
  }),
});

/**
 * Select role schema
 * Uses onboarding_token since user doesn't have JWT yet
 */
const selectRoleSchema = Joi.object({
  onboarding_token: Joi.string().required().messages({
    'string.empty': 'Onboarding token is required',
    'any.required': 'Onboarding token is required',
  }),
  role: Joi.string().valid('DRIVER', 'OPERATOR').required().messages({
    'string.empty': 'Role is required',
    'any.only': 'Role must be either DRIVER or OPERATOR',
    'any.required': 'Role is required',
  }),
});

/**
 * Admin login schema
 */
const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

/**
 * Change password schema
 */
const changePasswordSchema = Joi.object({
  current_password: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required',
  }),
  new_password: Joi.string().min(6).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 6 characters',
    'any.required': 'New password is required',
  }),
});

/**
 * Validate request body against schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: {
          code: 'VALIDATION_ERROR',
          details,
        },
      });
    }

    next();
  };
};

module.exports = {
  validateLogin: validate(loginSchema),
  validateSelectRole: validate(selectRoleSchema),
  validateAdminLogin: validate(adminLoginSchema),
  validateChangePassword: validate(changePasswordSchema),
};
