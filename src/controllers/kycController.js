const kycService = require('../services/kycService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * GET /kyc/status
 * Get KYC status and documents
 */
const getKycStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const status = await kycService.getKycStatus(userId);

    return sendSuccess(res, status, 'KYC status fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /kyc/submit
 * Submit or update KYC (personal info + documents)
 * 
 * Handles both:
 * - Initial submission: Send all data
 * - Resubmission: Send only fields/documents to update
 */
const submitKyc = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const files = req.files || {};

    const result = await kycService.submitKyc(userId, req.body, files);

    return sendSuccess(res, result, 'KYC submitted for verification');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKycStatus,
  submitKyc,
};
