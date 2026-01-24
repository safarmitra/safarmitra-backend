const crypto = require('crypto');
const { User, UserIdentity, Role } = require('../models');
const uploadService = require('./uploadService');
const authService = require('./authService');
const { compareIds } = require('../utils/helpers');

/**
 * Hash document number for security
 */
const hashDocumentNumber = (documentNumber) => {
  return crypto.createHash('sha256').update(documentNumber).digest('hex');
};

/**
 * Get KYC status and documents (using onboarding token)
 * 
 * Logic:
 * 1. Find user by onboarding token
 * 2. Find all documents for user from user_identity table
 * 3. If KYC is APPROVED, generate JWT token and clear onboarding token
 * 4. Return KYC status, personal info, documents list, and token (if approved)
 */
const getKycStatus = async (onboardingToken) => {
  // Find user by onboarding token
  const user = await authService.findUserByOnboardingToken(onboardingToken);

  const documents = await UserIdentity.findAll({
    where: { user_id: user.id },
    attributes: ['id', 'document_type', 'front_doc_url', 'back_doc_url', 'status', 'reject_reason', 'created_at'],
    order: [['created_at', 'DESC']],
  });

  // Build onboarding status
  const kycSubmitted = user.kyc_status !== 'NOT_SUBMITTED';
  const isApproved = user.kyc_status === 'APPROVED';

  // If KYC is approved, generate JWT token and clear onboarding token
  let token = null;
  if (isApproved) {
    token = authService.generateToken(user);
    
    // Clear onboarding token since user is now verified
    await user.update({
      onboarding_token: null,
      onboarding_token_expires_at: null,
    });
  }

  return {
    token, // JWT token (only when APPROVED, null otherwise)
    kyc_status: user.kyc_status,
    kyc_reject_reason: user.kyc_reject_reason,
    personal_info: {
      full_name: user.full_name,
      address: user.address,
      agency_name: user.agency_name,
      profile_image_url: user.profile_image_url,
    },
    documents: documents.map((doc) => ({
      id: doc.id,
      document_type: doc.document_type,
      front_doc_url: doc.front_doc_url,
      back_doc_url: doc.back_doc_url,
      status: doc.status,
      reject_reason: doc.reject_reason,
    })),
    user: isApproved ? authService.formatUserResponse(user) : null, // User data (only when APPROVED)
    onboarding: {
      role_selected: !!user.role_id,
      kyc_submitted: kycSubmitted,
      kyc_status: user.kyc_status,
    },
  };
};

/**
 * Submit or Update KYC (Combined personal info + documents)
 * Uses onboarding token for authentication
 * 
 * Logic:
 * 1. Find user by onboarding token
 * 2. Check user has selected a role
 * 3. Update personal info if provided (full_name, address, agency_name)
 * 4. Upload profile image if provided
 * 5. Process each document:
 *    a. Hash document number
 *    b. Check for duplicates (same hash, different user)
 *    c. Upload front/back images to S3
 *    d. Create new or update existing document record
 * 6. Update user's kyc_status to 'PENDING'
 * 7. Return success with summary and onboarding status
 * 
 * Note: This handles both initial submission and resubmission
 * - For initial: Send all data
 * - For resubmission: Send only the fields/documents to update
 */
const submitKyc = async (onboardingToken, data, files) => {
  // Step 1: Find user by onboarding token
  const user = await authService.findUserByOnboardingToken(onboardingToken);

  // Step 2: Check user has selected a role
  if (!user.role_id) {
    throw new Error('Please select a role before submitting KYC');
  }

  const updateData = {};
  let documentsProcessed = 0;

  // Step 3: Update personal info if provided
  if (data.full_name) updateData.full_name = data.full_name;
  if (data.address) updateData.address = data.address;
  if (data.agency_name !== undefined) updateData.agency_name = data.agency_name;

  // Step 4: Upload profile image if provided
  const profileImage = files['profile_image']?.[0];
  if (profileImage) {
    // Delete old image if exists
    if (user.profile_image_url) {
      const oldKey = uploadService.getKeyFromUrl(user.profile_image_url);
      if (oldKey) {
        try {
          await uploadService.deleteFromS3(oldKey);
        } catch (error) {
          console.error('Error deleting old profile image:', error.message);
        }
      }
    }

    const { url } = await uploadService.uploadToS3(profileImage, 'profiles');
    updateData.profile_image_url = url;
  }

  // Update user if there's data to update
  if (Object.keys(updateData).length > 0) {
    await user.update(updateData);
  }

  // Step 5: Process documents if provided
  const documents = data.documents || [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const frontKey = `documents[${i}][front_doc]`;
    const backKey = `documents[${i}][back_doc]`;
    const frontFile = files[frontKey]?.[0];
    const backFile = files[backKey]?.[0];

    if (!frontFile) {
      continue; // Skip if no front file (shouldn't happen due to validation)
    }

    // Hash document number
    const documentHash = hashDocumentNumber(doc.document_number);

    // Check for duplicates (same hash, different user)
    const existingDoc = await UserIdentity.findOne({
      where: { document_number_hash: documentHash },
    });

    if (existingDoc && !compareIds(existingDoc.user_id, user.id)) {
      throw new Error(`${doc.document_type} is already registered with another account`);
    }

    // Upload front document
    const frontUpload = await uploadService.uploadToS3(frontFile, 'documents');

    // Upload back document if provided
    let backUrl = null;
    if (backFile) {
      const backUpload = await uploadService.uploadToS3(backFile, 'documents');
      backUrl = backUpload.url;
    }

    // Check if user already has this document type
    const userExistingDoc = await UserIdentity.findOne({
      where: { user_id: user.id, document_type: doc.document_type },
    });

    if (userExistingDoc) {
      // Update existing document
      await userExistingDoc.update({
        document_number_hash: documentHash,
        front_doc_url: frontUpload.url,
        back_doc_url: backUrl || userExistingDoc.back_doc_url,
        status: 'PENDING',
        reject_reason: null,
      });
    } else {
      // Create new document
      await UserIdentity.create({
        user_id: user.id,
        document_type: doc.document_type,
        document_number_hash: documentHash,
        front_doc_url: frontUpload.url,
        back_doc_url: backUrl,
        status: 'PENDING',
      });
    }

    documentsProcessed++;
  }

  // Step 6: Update user KYC status to PENDING
  await user.update({
    kyc_status: 'PENDING',
    kyc_reject_reason: null,
  });

  // Step 7: Return success with onboarding status
  return {
    kyc_status: 'PENDING',
    personal_info_updated: Object.keys(updateData).length > 0,
    documents_processed: documentsProcessed,
    message: 'KYC submitted for verification',
    onboarding: {
      role_selected: true,
      kyc_submitted: true,
      kyc_status: 'PENDING',
    },
  };
};

module.exports = {
  getKycStatus,
  submitKyc,
  hashDocumentNumber,
};
