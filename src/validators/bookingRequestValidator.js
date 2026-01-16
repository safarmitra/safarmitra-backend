'use strict';

const Joi = require('joi');

/**
 * Validation schema for creating a booking request (Driver requesting a car)
 */
const createBookingRequestSchema = Joi.object({
  car_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Car ID must be a number',
      'number.integer': 'Car ID must be an integer',
      'number.positive': 'Car ID must be a positive number',
      'any.required': 'Car ID is required',
    }),
  message: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'Message cannot exceed 1000 characters',
    }),
});

/**
 * Validation schema for operator inviting a driver
 */
const inviteDriverSchema = Joi.object({
  car_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Car ID must be a number',
      'number.integer': 'Car ID must be an integer',
      'number.positive': 'Car ID must be a positive number',
      'any.required': 'Car ID is required',
    }),
  driver_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Driver ID must be a number',
      'number.integer': 'Driver ID must be an integer',
      'number.positive': 'Driver ID must be a positive number',
      'any.required': 'Driver ID is required',
    }),
  message: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'Message cannot exceed 1000 characters',
    }),
});

/**
 * Validation schema for updating booking request status
 */
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('ACCEPTED', 'REJECTED')
    .required()
    .messages({
      'any.only': 'Status must be either ACCEPTED or REJECTED',
      'any.required': 'Status is required',
    }),
  reject_reason: Joi.string()
    .max(500)
    .allow('', null)
    .when('status', {
      is: 'REJECTED',
      then: Joi.string().max(500).allow('', null),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'string.max': 'Reject reason cannot exceed 500 characters',
      'any.unknown': 'Reject reason is only allowed when rejecting a request',
    }),
});

/**
 * Validation schema for listing booking requests
 */
const listBookingRequestsSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'ACCEPTED', 'REJECTED', 'ALL')
    .default('ALL')
    .messages({
      'any.only': 'Status must be PENDING, ACCEPTED, REJECTED, or ALL',
    }),
  car_id: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'Car ID must be a number',
      'number.integer': 'Car ID must be an integer',
      'number.positive': 'Car ID must be a positive number',
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50',
    }),
});

/**
 * Middleware to validate create booking request (Driver)
 */
const validateCreateBookingRequest = (req, res, next) => {
  const { error, value } = createBookingRequestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
  }

  req.body = value;
  next();
};

/**
 * Middleware to validate invite driver (Operator)
 */
const validateInviteDriver = (req, res, next) => {
  const { error, value } = inviteDriverSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
  }

  req.body = value;
  next();
};

/**
 * Middleware to validate update status
 */
const validateUpdateStatus = (req, res, next) => {
  const { error, value } = updateStatusSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
  }

  req.body = value;
  next();
};

/**
 * Middleware to validate list query params
 */
const validateListBookingRequests = (req, res, next) => {
  const { error, value } = listBookingRequestsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
  }

  req.query = value;
  next();
};

module.exports = {
  validateCreateBookingRequest,
  validateInviteDriver,
  validateUpdateStatus,
  validateListBookingRequests,
};
