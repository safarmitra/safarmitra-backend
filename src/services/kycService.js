const crypto = require('crypto');
const { User, UserIdentity } = require('../models');
const uploadService = require('./uploadService');

/**
 * Hash document number for security
 */
const hashDocumentNumber = (documentNumber) => {
  return crypto.createHash('sha256').update(documentNumber).digest('hex');
};

/**
 * Get KYC status and documents
 * 
 * Logic:
 * 1. Find user by ID with KYC fields
 * 2. Find all documents for user from user_identity table
 * 3. Return KYC status, personal info, and documents list
 */
const getKycStatus = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'kyc_status', 'kyc_reject_reason', 'full_name', 'address', 'agency_name', 'profile_image_url'],
  });

  if (!user) {
    throw new Error('User not found');
  }

  const documents = await UserIdentity.findAll({
    where: { user_id: userId },
    attributes: ['id', 'document_type', 'front_doc_url', 'back_doc_url', 'status', 'reject_reason', 'created_at'],
    order: [['created_at', 'DESC']],
  });

  return {
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
  };
};

/**
 * Submit or Update KYC (Combined personal info + documents)
 * 
 * Logic:
 * 1. Find user by ID
 * 2. Update personal info if provided (full_name, address, agency_name)
 * 3. Upload profile image if provided
 * 4. Process each document:
 *    a. Hash document number
 *    b. Check for duplicates (same hash, different user)
 *    c. Upload front/back images to S3
 *    d. Create new or update existing document record
 * 5. Update user's kyc_status to 'PENDING'
 * 6. Return success with summary
 * 
 * Note: This handles both initial submission and resubmission
 * - For initial: Send all data
 * - For resubmission: Send only the fields/documents to update
 */
const submitKyc = async (userId, data, files) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const updateData = {};
  let documentsProcessed = 0;

  // Step 2: Update personal info if provided
  if (data.full_name) updateData.full_name = data.full_name;
  if (data.address) updateData.address = data.address;
  if (data.agency_name !== undefined) updateData.agency_name = data.agency_name;

  // Step 3: Upload profile image if provided
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

  // Step 4: Process documents if provided
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

    if (existingDoc && existingDoc.user_id !== parseInt(userId)) {
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
      where: { user_id: userId, document_type: doc.document_type },
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
        user_id: userId,
        document_type: doc.document_type,
        document_number_hash: documentHash,
        front_doc_url: frontUpload.url,
        back_doc_url: backUrl,
        status: 'PENDING',
      });
    }

    documentsProcessed++;
  }

  // Step 5: Update user KYC status to PENDING
  await user.update({
    kyc_status: 'PENDING',
    kyc_reject_reason: null,
  });

  // Step 6: Return success
  return {
    kyc_status: 'PENDING',
    personal_info_updated: Object.keys(updateData).length > 0,
    documents_processed: documentsProcessed,
    message: 'KYC submitted for verification',
  };
};

module.exports = {
  getKycStatus,
  submitKyc,
  hashDocumentNumber,
};
