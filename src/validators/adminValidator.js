'use strict';

const Joi = require('joi');

/**
 * Validation schema for listing users
 */
const listUsersSchema = Joi.object({
  search: Joi.string().max(100).allow('', null),
  role: Joi.string().valid('DRIVER', 'OPERATOR', 'ALL').default('ALL'),
  kyc_status: Joi.string().valid('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'ALL').default('ALL'),
  is_active: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

/**
 * Validation schema for updating user status
 */
const updateUserStatusSchema = Joi.object({
  is_active: Joi.boolean().required().messages({
    'any.required': 'is_active is required',
    'boolean.base': 'is_active must be a boolean',
  }),
  reason: Joi.string().max(500).allow('', null),
});

/**
 * Validation schema for updating user KYC status
 */
const updateKycStatusSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED').required().messages({
    'any.only': 'Status must be either APPROVED or REJECTED',
    'any.required': 'Status is required',
  }),
  reject_reason: Joi.string()
    .max(500)
    .when('status', {
      is: 'REJECTED',
      then: Joi.string().max(500).allow('', null),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'string.max': 'Reject reason cannot exceed 500 characters',
      'any.unknown': 'Reject reason is only allowed when rejecting',
    }),
});

/**
 * Validation schema for updating document status
 */
const updateDocumentStatusSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED').required().messages({
    'any.only': 'Status must be either APPROVED or REJECTED',
    'any.required': 'Status is required',
  }),
  reject_reason: Joi.string()
    .max(500)
    .when('status', {
      is: 'REJECTED',
      then: Joi.string().max(500).allow('', null),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'string.max': 'Reject reason cannot exceed 500 characters',
      'any.unknown': 'Reject reason is only allowed when rejecting',
    }),
});

/**
 * Validation schema for listing cars (admin)
 */
const listCarsSchema = Joi.object({
  search: Joi.string().max(100).allow('', null),
  operator_id: Joi.number().integer().positive(),
  category: Joi.string().valid('TAXI', 'PRIVATE'),
  is_active: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

/**
 * Validation schema for listing booking requests (admin)
 */
const listBookingRequestsSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ACCEPTED', 'REJECTED', 'ALL').default('ALL'),
  initiated_by: Joi.string().valid('DRIVER', 'OPERATOR', 'ALL').default('ALL'),
  car_id: Joi.number().integer().positive(),
  driver_id: Joi.number().integer().positive(),
  operator_id: Joi.number().integer().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

/**
 * Validation schema for listing pending KYC
 */
const listPendingKycSchema = Joi.object({
  role: Joi.string().valid('DRIVER', 'OPERATOR', 'ALL').default('ALL'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// Middleware functions
const validateListUsers = (req, res, next) => {
  const { error, value } = listUsersSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      },
    });
  }

  req.query = value;
  next();
};

const validateUpdateUserStatus = (req, res, next) => {
  const { error, value } = updateUserStatusSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      },
    });
  }

  req.body = value;
  next();
};

const validateUpdateKycStatus = (req, res, next) => {
  const { error, value } = updateKycStatusSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      },
    });
  }

  req.body = value;
  next();
};

const validateUpdateDocumentStatus = (req, res, next) => {
  const { error, value } = updateDocumentStatusSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      },
    });
  }

  req.body = value;
  next();
};

const validateListCars = (req, res, next) => {
  const { error, value } = listCarsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      },
    });
  }

  req.query = value;
  next();
};

const validateListBookingRequests = (req, res, next) => {
  const { error, value } = listBookingRequestsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      },
    });
  }

  req.query = value;
  next();
};

const validateListPendingKyc = (req, res, next) => {
  const { error, value } = listPendingKycSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      },
    });
  }

  req.query = value;
  next();
};

module.exports = {
  validateListUsers,
  validateUpdateUserStatus,
  validateUpdateKycStatus,
  validateUpdateDocumentStatus,
  validateListCars,
  validateListBookingRequests,
  validateListPendingKyc,
};
