const express = require('express');
const router = express.Router();
const multer = require('multer');
const kycController = require('../controllers/kycController');
const { validateKycSubmit, validateDocumentFiles } = require('../validators/kycValidator');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// KYC routes use Firebase token (not JWT)
// Because user doesn't have JWT until KYC is approved

// GET /kyc/status - Get KYC status and documents
// Pass firebase_token as query param or X-Firebase-Token header
router.get('/status', kycController.getKycStatus);

// POST /kyc/submit - Submit or update KYC (personal info + documents)
// Pass firebase_token in request body
router.post(
  '/submit',
  upload.any(), // Accept any files
  validateKycSubmit,
  validateDocumentFiles,
  kycController.submitKyc
);

module.exports = router;
