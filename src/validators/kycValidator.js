const Joi = require('joi');

const kycSubmitSchema = Joi.object({
  full_name: Joi.string().max(100).messages({
    'string.max': 'Full name must be less than 100 characters',
  }),
  address: Joi.string().max(500).messages({
    'string.max': 'Address must be less than 500 characters',
  }),
  agency_name: Joi.string().max(150).allow('', null).messages({
    'string.max': 'Agency name must be less than 150 characters',
  }),
  documents: Joi.array().items(
    Joi.object({
      document_type: Joi.string().required().messages({
        'string.empty': 'Document type is required',
        'any.required': 'Document type is required',
      }),
      document_number: Joi.string().required().messages({
        'string.empty': 'Document number is required',
        'any.required': 'Document number is required',
      }),
    })
  ),
});

/**
 * Validate KYC submit request
 */
const validateKycSubmit = (req, res, next) => {
  const { error } = kycSubmitSchema.validate(req.body, { abortEarly: false });

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

/**
 * Validate that documents have required files
 */
const validateDocumentFiles = (req, res, next) => {
  const { documents } = req.body;
  const files = req.files || {};

  if (documents && Array.isArray(documents)) {
    for (let i = 0; i < documents.length; i++) {
      const frontKey = `documents[${i}][front_doc]`;
      const frontFile = files[frontKey]?.[0];

      if (!frontFile) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: {
            code: 'VALIDATION_ERROR',
            details: [
              {
                field: `documents[${i}].front_doc`,
                message: `Front document image is required for ${documents[i].document_type || 'document ' + i}`,
              },
            ],
          },
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(frontFile.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: {
            code: 'VALIDATION_ERROR',
            details: [
              {
                field: `documents[${i}].front_doc`,
                message: 'Only JPEG, JPG, PNG and PDF files are allowed',
              },
            ],
          },
        });
      }

      // Validate file size (5MB)
      if (frontFile.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: {
            code: 'VALIDATION_ERROR',
            details: [
              {
                field: `documents[${i}].front_doc`,
                message: 'File size must be less than 5MB',
              },
            ],
          },
        });
      }
    }
  }

  next();
};

module.exports = {
  validateKycSubmit,
  validateDocumentFiles,
};
