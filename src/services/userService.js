const { User, Role } = require('../models');
const uploadService = require('./uploadService');

/**
 * Get user profile by ID (current user)
 * 
 * Logic:
 * 1. Find user by ID with role association
 * 2. Throw error if user not found
 * 3. Format and return user profile
 */
const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: 'role' }],
  });

  if (!user) {
    throw new Error('User not found');
  }

  return formatUserProfile(user);
};

/**
 * Update user profile (info + image)
 * 
 * Logic:
 * 1. Find user by ID
 * 2. Throw error if user not found
 * 3. Build update data from allowed fields
 * 4. If profile image provided:
 *    a. Delete old image from S3 (if exists)
 *    b. Upload new image to S3
 *    c. Add new image URL to update data
 * 5. Update user record
 * 6. Return updated profile
 */
const updateProfile = async (userId, data, profileImage = null) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Build update data from allowed fields
  const allowedFields = ['full_name', 'address', 'agency_name', 'dob'];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  // Handle profile image upload
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

    // Upload new image
    const { url } = await uploadService.uploadToS3(profileImage, 'profiles');
    updateData.profile_image_url = url;
  }

  // Update user
  await user.update(updateData);

  return getProfile(userId);
};

/**
 * Get public user info by ID
 * 
 * Logic:
 * 1. Find user by ID with limited fields
 * 2. Throw error if user not found
 * 3. Return public profile data
 */
const getPublicProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'full_name', 'agency_name', 'profile_image_url', 'phone_number', 'kyc_status'],
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    full_name: user.full_name,
    agency_name: user.agency_name,
    profile_image_url: user.profile_image_url,
    phone_number: user.phone_number,
    kyc_verified: user.kyc_status === 'APPROVED',
  };
};

/**
 * Format user profile response
 */
const formatUserProfile = (user) => {
  return {
    id: user.id,
    phone_number: user.phone_number,
    full_name: user.full_name,
    address: user.address,
    agency_name: user.agency_name,
    profile_image_url: user.profile_image_url,
    dob: user.dob,
    role: user.role?.code || null,
    kyc_status: user.kyc_status,
    is_active: user.is_active,
    created_at: user.created_at,
  };
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile,
  formatUserProfile,
};
