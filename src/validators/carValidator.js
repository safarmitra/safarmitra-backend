const Joi = require('joi');

/**
 * Indian Vehicle Registration Number Validation
 * 
 * Standard Format: [STATE][DISTRICT][SERIES][NUMBER]
 * Examples: GJ01AB1234, MH12DE5678, DL4CAF1234
 * 
 * Bharat Series Format: [YEAR]BH[NUMBER][SERIES]
 * Examples: 22BH1234AB, 23BH5678CD
 * 
 * Both formats should be exactly 10 characters (after normalization)
 */
const vehicleNumberValidation = (value, helpers) => {
  // Convert to uppercase and remove any spaces
  const normalized = value.toUpperCase().replace(/\s/g, '');
  
  // Check length - must be exactly 10 characters
  if (normalized.length !== 10) {
    return helpers.error('car_number.length');
  }
  
  // Standard Indian format: 2 letters + 2 digits + 2 letters + 4 digits
  // Example: GJ01AB1234
  const standardPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
  
  // Bharat Series format: 2 digits + BH + 4 digits + 2 letters
  // Example: 22BH1234AB
  const bharatPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{2}$/;
  
  if (!standardPattern.test(normalized) && !bharatPattern.test(normalized)) {
    return helpers.error('car_number.format');
  }
  
  return normalized; // Return normalized (uppercase) value
};

const createCarSchema = Joi.object({
  car_number: Joi.string()
    .required()
    .custom(vehicleNumberValidation)
    .messages({
      'string.empty': 'Vehicle registration number is required',
      'any.required': 'Vehicle registration number is required',
      'car_number.length': 'Vehicle registration number must be exactly 10 characters',
      'car_number.format': 'Invalid vehicle number format. Use format like GJ01AB1234 or 22BH1234AB',
    }),
  car_name: Joi.string().max(100).required().messages({
    'string.empty': 'Car name is required',
    'string.max': 'Car name must be less than 100 characters',
    'any.required': 'Car name is required',
  }),
  city: Joi.string().max(100).required().messages({
    'string.empty': 'City is required',
    'string.max': 'City must be less than 100 characters',
    'any.required': 'City is required',
  }),
  area: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Area must be less than 100 characters',
  }),
  category: Joi.string().valid('TAXI', 'PRIVATE').required().messages({
    'string.empty': 'Category is required',
    'any.only': 'Category must be either TAXI or PRIVATE',
    'any.required': 'Category is required',
  }),
  transmission: Joi.string().valid('MANUAL', 'AUTOMATIC').required().messages({
    'string.empty': 'Transmission is required',
    'any.only': 'Transmission must be either MANUAL or AUTOMATIC',
    'any.required': 'Transmission is required',
  }),
  fuel_type: Joi.string().valid('PETROL', 'DIESEL', 'CNG', 'ELECTRIC').required().messages({
    'string.empty': 'Fuel type is required',
    'any.only': 'Fuel type must be PETROL, DIESEL, CNG, or ELECTRIC',
    'any.required': 'Fuel type is required',
  }),
  rate_type: Joi.string().valid('12HR', '24HR').required().messages({
    'string.empty': 'Rate type is required',
    'any.only': 'Rate type must be either 12HR or 24HR',
    'any.required': 'Rate type is required',
  }),
  rate_amount: Joi.number().positive().required().messages({
    'number.base': 'Rate amount must be a number',
    'number.positive': 'Rate amount must be positive',
    'any.required': 'Rate amount is required',
  }),
  deposit_amount: Joi.number().min(0).allow(null, '').messages({
    'number.base': 'Deposit amount must be a number',
    'number.min': 'Deposit amount cannot be negative',
  }),
  purposes: Joi.string().allow(null, '').messages({
    'string.base': 'Purposes must be a string',
  }),
  instructions: Joi.string().max(1000).allow(null, '').messages({
    'string.max': 'Instructions must be less than 1000 characters',
  }),
  is_active: Joi.boolean().messages({
    'boolean.base': 'is_active must be a boolean',
  }),
  primary_image_index: Joi.number().min(0).max(4).allow(null, '').messages({
    'number.base': 'Primary image index must be a number',
    'number.min': 'Primary image index must be at least 0',
    'number.max': 'Primary image index must be at most 4',
  }),
});

const updateCarSchema = Joi.object({
  car_name: Joi.string().max(100).messages({
    'string.max': 'Car name must be less than 100 characters',
  }),
  city: Joi.string().max(100).messages({
    'string.max': 'City must be less than 100 characters',
  }),
  area: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Area must be less than 100 characters',
  }),
  category: Joi.string().valid('TAXI', 'PRIVATE').messages({
    'any.only': 'Category must be either TAXI or PRIVATE',
  }),
  transmission: Joi.string().valid('MANUAL', 'AUTOMATIC').messages({
    'any.only': 'Transmission must be either MANUAL or AUTOMATIC',
  }),
  fuel_type: Joi.string().valid('PETROL', 'DIESEL', 'CNG', 'ELECTRIC').messages({
    'any.only': 'Fuel type must be PETROL, DIESEL, CNG, or ELECTRIC',
  }),
  rate_type: Joi.string().valid('12HR', '24HR').messages({
    'any.only': 'Rate type must be either 12HR or 24HR',
  }),
  rate_amount: Joi.number().positive().messages({
    'number.base': 'Rate amount must be a number',
    'number.positive': 'Rate amount must be positive',
  }),
  deposit_amount: Joi.number().min(0).allow(null, '').messages({
    'number.base': 'Deposit amount must be a number',
    'number.min': 'Deposit amount cannot be negative',
  }),
  purposes: Joi.string().allow(null, '').messages({
    'string.base': 'Purposes must be a string',
  }),
  instructions: Joi.string().max(1000).allow(null, '').messages({
    'string.max': 'Instructions must be less than 1000 characters',
  }),
  is_active: Joi.boolean().messages({
    'boolean.base': 'is_active must be a boolean',
  }),
  primary_image_index: Joi.number().min(0).max(4).allow(null, '').messages({
    'number.base': 'Primary image index must be a number',
    'number.min': 'Primary image index must be at least 0',
    'number.max': 'Primary image index must be at most 4',
  }),
  remove_images: Joi.string().allow(null, '').messages({
    'string.base': 'remove_images must be a comma-separated string of image IDs',
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
 * Validate RC documents for create car
 */
const validateRcDocuments = (req, res, next) => {
  const files = req.files || {};

  // Check RC front
  if (!files['rc_front'] || !files['rc_front'][0]) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ field: 'rc_front', message: 'RC front image is required' }],
      },
    });
  }

  // Check RC back
  if (!files['rc_back'] || !files['rc_back'][0]) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ field: 'rc_back', message: 'RC back image is required' }],
      },
    });
  }

  // Validate file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const allFiles = [
    ...(files['rc_front'] || []),
    ...(files['rc_back'] || []),
    ...(files['images'] || []),
  ];

  for (const file of allFiles) {
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ field: file.fieldname, message: 'Only JPEG, JPG, PNG and PDF files are allowed' }],
        },
      });
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ field: file.fieldname, message: 'File size must be less than 5MB' }],
        },
      });
    }
  }

  // Check max 5 images
  if (files['images'] && files['images'].length > 5) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ field: 'images', message: 'Maximum 5 car images allowed' }],
      },
    });
  }

  next();
};

/**
 * Validate files for update car (optional)
 */
const validateUpdateFiles = (req, res, next) => {
  const files = req.files || {};
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const allFiles = [
    ...(files['rc_front'] || []),
    ...(files['rc_back'] || []),
    ...(files['images'] || []),
  ];

  for (const file of allFiles) {
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ field: file.fieldname, message: 'Only JPEG, JPG, PNG and PDF files are allowed' }],
        },
      });
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ field: file.fieldname, message: 'File size must be less than 5MB' }],
        },
      });
    }
  }

  // Check max 5 images
  if (files['images'] && files['images'].length > 5) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ field: 'images', message: 'Maximum 5 car images allowed' }],
      },
    });
  }

  next();
};

module.exports = {
  validateCreateCar: validate(createCarSchema),
  validateUpdateCar: validate(updateCarSchema),
  validateRcDocuments,
  validateUpdateFiles,
};
