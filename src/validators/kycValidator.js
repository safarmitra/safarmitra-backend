const Joi = require('joi');

const kycSubmitSchema = Joi.object({
  onboarding_token: Joi.string().required().messages({
    'string.empty': 'Onboarding token is required',
    'any.required': 'Onboarding token is required',
  }),
  full_name: Joi.string().max(100).messages({
    'string.max': 'Full name must be less than 100 characters',
  }),
  dob: Joi.string().max(15).messages({
    'string.max': 'Date of birth must be less than 15 characters',
  }),
  city: Joi.string().max(100).messages({
    'string.max': 'City must be less than 100 characters',
  }),
  area: Joi.string().max(100).allow('', null).messages({
    'string.max': 'Area must be less than 100 characters',
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
 * Convert files array to object for easier access
 * multer.any() returns array, we need object with fieldname as key
 */
const convertFilesToObject = (filesArray) => {
  const filesObj = {};
  if (Array.isArray(filesArray)) {
    filesArray.forEach((file) => {
      if (!filesObj[file.fieldname]) {
        filesObj[file.fieldname] = [];
      }
      filesObj[file.fieldname].push(file);
    });
  }
  return filesObj;
};

/**
 * Validate that documents have required files
 */
const validateDocumentFiles = (req, res, next) => {
  const { documents } = req.body;
  
  // Convert files array to object for easier access
  const filesArray = req.files || [];
  const files = convertFilesToObject(filesArray);
  
  // Attach converted files object to request for use in controller/service
  req.files = files;

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
