const kycService = require('../services/kycService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * GET /kyc/status
 * Get KYC status and documents
 * 
 * Uses onboarding_token for authentication
 * Because user doesn't have JWT until KYC is approved
 */
const getKycStatus = async (req, res, next) => {
  try {
    // Get onboarding_token from query params or header
    const onboardingToken = req.query.onboarding_token || req.headers['x-onboarding-token'];

    if (!onboardingToken) {
      return sendError(res, 'Onboarding token is required', 400, 'VALIDATION_ERROR');
    }

    const status = await kycService.getKycStatus(onboardingToken);

    return sendSuccess(res, status, 'KYC status fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /kyc/submit
 * Submit or update KYC (personal info + documents)
 * 
 * Uses onboarding_token for authentication
 * Because user doesn't have JWT until KYC is approved
 * 
 * Handles both:
 * - Initial submission: Send all data
 * - Resubmission: Send only fields/documents to update
 */
const submitKyc = async (req, res, next) => {
  try {
    const onboardingToken = req.body.onboarding_token;

    if (!onboardingToken) {
      return sendError(res, 'Onboarding token is required', 400, 'VALIDATION_ERROR');
    }

    const files = req.files || {};

    const result = await kycService.submitKyc(onboardingToken, req.body, files);

    return sendSuccess(res, result, 'KYC submitted for verification');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKycStatus,
  submitKyc,
};
