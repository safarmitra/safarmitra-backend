const Joi = require('joi');

/**
 * Profile update schema - Only city and area can be updated
 * All other fields are silently ignored at the service level
 */
const updateProfileSchema = Joi.object({
  city: Joi.string().max(100).allow('', null).messages({
    'string.max': 'City must be less than 100 characters',
  }),
  area: Joi.string().max(100).allow('', null).messages({
    'string.max': 'Area must be less than 100 characters',
  }),
}).unknown(true); // Allow unknown fields but they will be ignored by service

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

/**
 * Validate profile image file
 */
const validateProfileImage = (req, res, next) => {
  if (req.file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ field: 'profile_image', message: 'Only JPEG, JPG and PNG images are allowed' }],
        },
      });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ field: 'profile_image', message: 'Image size must be less than 5MB' }],
        },
      });
    }
  }

  next();
};

/**
 * Validation schema for listing drivers
 */
const listDriversSchema = Joi.object({
  search: Joi.string().max(100).allow('', null),
  city: Joi.string().max(100).allow('', null),
  area: Joi.string().max(100).allow('', null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

/**
 * Validate list drivers query params
 */
const validateListDrivers = (req, res, next) => {
  const { error, value } = listDriversSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

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

  req.query = value;
  next();
};

module.exports = {
  validateUpdateProfile: validate(updateProfileSchema),
  validateProfileImage,
  validateListDrivers,
};
