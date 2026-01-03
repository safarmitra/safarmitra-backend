const express = require('express');
const router = express.Router();
const multer = require('multer');
const kycController = require('../controllers/kycController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { validateKycSubmit, validateDocumentFiles } = require('../validators/kycValidator');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// All routes require authentication
router.use(authMiddleware);

// GET /kyc/status - Get KYC status and documents
router.get('/status', kycController.getKycStatus);

// POST /kyc/submit - Submit or update KYC (personal info + documents)
router.post(
  '/submit',
  upload.any(), // Accept any files
  validateKycSubmit,
  validateDocumentFiles,
  kycController.submitKyc
);

module.exports = router;
