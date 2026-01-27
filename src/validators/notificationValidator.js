'use strict';

const Joi = require('joi');
const { NOTIFICATION_TYPES } = require('../utils/notificationTemplates');

/**
 * List notifications query schema
 */
const listNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(50).default(20).messages({
    'number.base': 'Limit must be a number',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 50',
  }),
  type: Joi.string()
    .valid(...Object.values(NOTIFICATION_TYPES))
    .messages({
      'any.only': 'Invalid notification type',
    }),
});

/**
 * Notification ID param schema
 */
const notificationIdSchema = Joi.object({
  id: Joi.number().integer().min(1).required().messages({
    'number.base': 'Notification ID must be a number',
    'number.min': 'Notification ID must be a positive integer',
    'any.required': 'Notification ID is required',
  }),
});

/**
 * Validate request query against schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });

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

    // Update req.query with validated/defaulted values
    req.query = value;
    next();
  };
};

/**
 * Validate request params against schema
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, { abortEarly: false });

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

    req.params = value;
    next();
  };
};

module.exports = {
  validateListNotifications: validateQuery(listNotificationsSchema),
  validateNotificationId: validateParams(notificationIdSchema),
};
