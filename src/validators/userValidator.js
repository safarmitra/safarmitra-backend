const Joi = require('joi');

const updateProfileSchema = Joi.object({
  full_name: Joi.string().max(100).allow('', null).messages({
    'string.max': 'Full name must be less than 100 characters',
  }),
  address: Joi.string().max(500).allow('', null).messages({
    'string.max': 'Address must be less than 500 characters',
  }),
  agency_name: Joi.string().max(150).allow('', null).messages({
    'string.max': 'Agency name must be less than 150 characters',
  }),
  dob: Joi.string().max(15).allow('', null).messages({
    'string.max': 'Date of birth must be less than 15 characters',
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
