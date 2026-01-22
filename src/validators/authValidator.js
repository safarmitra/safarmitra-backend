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
};
