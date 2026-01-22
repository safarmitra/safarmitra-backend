const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');
const { User, Role } = require('../models');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ONBOARDING_TOKEN_EXPIRES_DAYS = 7;

/**
 * Generate a secure random onboarding token
 */
const generateOnboardingToken = () => {
  return 'obt_' + crypto.randomBytes(32).toString('hex');
};

/**
 * Verify Firebase ID token and extract phone number
 */
const verifyFirebaseToken = async (firebaseToken) => {
  try {
    if (admin.apps.length === 0) {
      throw new Error('Firebase not initialized');
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    if (!decodedToken.phone_number) {
      throw new Error('Phone number not found in token');
    }

    return {
      phoneNumber: decodedToken.phone_number,
      uid: decodedToken.uid,
    };
  } catch (error) {
    throw new Error('Invalid Firebase token: ' + error.message);
  }
};

/**
 * Find user by onboarding token
 * Used for onboarding APIs (select-role, kyc) that don't require JWT
 */
const findUserByOnboardingToken = async (onboardingToken) => {
  if (!onboardingToken) {
    throw new Error('Onboarding token is required');
  }

  const user = await User.findOne({
    where: {
      onboarding_token: onboardingToken,
      onboarding_token_expires_at: {
        [Op.gt]: new Date(),
      },
    },
    include: [{ model: Role, as: 'role' }],
  });

  if (!user) {
    throw new Error('Invalid or expired onboarding token. Please login again.');
  }

  if (!user.is_active) {
    throw new Error('Your account has been suspended. Please contact support.');
  }

  return user;
};

/**
 * Generate JWT token
 * Only called when KYC is APPROVED
 * Contains all necessary user data so no DB lookups needed on protected routes
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    phoneNumber: user.phone_number,
    roleId: user.role_id,
    roleCode: user.role?.code || null,
    kycStatus: user.kyc_status,
    fullName: user.full_name,
    agencyName: user.agency_name,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Login or register user
 * 
 * Logic:
 * 1. Verify Firebase ID token
 * 2. Extract phone number from token
 * 3. Find existing user or create new user
 * 4. Update FCM token if provided
 * 5. Check if user is active (not suspended)
 * 6. Build onboarding status for Flutter navigation
 * 7. If KYC APPROVED → Generate JWT token, clear onboarding token
 * 8. If KYC NOT APPROVED → Generate onboarding token
 * 9. Return appropriate token, user data, and onboarding status
 */
const loginOrRegister = async (firebaseToken, fcmToken = null) => {
  let phoneNumber;

  // Step 1-2: Verify Firebase token and extract phone number
  if (admin.apps.length > 0) {
    const decoded = await verifyFirebaseToken(firebaseToken);
    phoneNumber = decoded.phoneNumber;
  } else {
    throw new Error('Firebase is not configured. Please add Firebase credentials.');
  }

  // Step 3: Find or create user
  let user = await User.findOne({
    where: { phone_number: phoneNumber },
    include: [{ model: Role, as: 'role' }],
  });

  let isNewUser = false;

  if (!user) {
    user = await User.create({
      phone_number: phoneNumber,
      fcm_token: fcmToken,
    });
    isNewUser = true;

    user = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }],
    });
  } else {
    // Step 4: Update FCM token if provided
    if (fcmToken) {
      await user.update({ fcm_token: fcmToken });
    }
  }

  // Step 5: Check if user is active
  if (!user.is_active) {
    throw new Error('Your account has been suspended. Please contact support.');
  }

  // Step 6: Build onboarding status
  const kycSubmitted = user.kyc_status !== 'NOT_SUBMITTED';
  const isVerified = user.kyc_status === 'APPROVED';

  const onboarding = {
    role_selected: !!user.role_id,
    kyc_submitted: kycSubmitted,
    kyc_status: user.kyc_status,
  };

  let token = null;
  let onboardingToken = null;

  if (isVerified) {
    // Step 7: KYC APPROVED → Generate JWT, clear onboarding token
    token = generateToken(user);
    
    // Clear onboarding token since user is now verified
    await user.update({
      onboarding_token: null,
      onboarding_token_expires_at: null,
    });
  } else {
    // Step 8: KYC NOT APPROVED → Generate onboarding token
    onboardingToken = generateOnboardingToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ONBOARDING_TOKEN_EXPIRES_DAYS);

    await user.update({
      onboarding_token: onboardingToken,
      onboarding_token_expires_at: expiresAt,
    });
  }

  // Step 9: Return response
  return {
    isNewUser,
    token,
    onboarding_token: onboardingToken,
    user: formatUserResponse(user),
    onboarding,
  };
};

/**
 * Select user role (using onboarding token)
 * 
 * Logic:
 * 1. Find user by onboarding token
 * 2. Validate role code exists in database
 * 3. Check user hasn't already completed KYC (role can't change after approval)
 * 4. Update user's role_id
 * 5. Return updated user data with onboarding status
 */
const selectRole = async (onboardingToken, roleCode) => {
  // Step 1: Find user by onboarding token
  const user = await findUserByOnboardingToken(onboardingToken);

  // Step 2: Find role
  const role = await Role.findOne({ where: { code: roleCode } });
  if (!role) {
    throw new Error('Invalid role');
  }

  // Step 3: Check if user can change role
  if (user.kyc_status === 'APPROVED') {
    throw new Error('Cannot change role after KYC approval');
  }

  // Step 4: Update user
  await user.update({ role_id: role.id });

  // Reload user with role
  await user.reload({ include: [{ model: Role, as: 'role' }] });

  // Step 5: Return updated user with onboarding status
  const kycSubmitted = user.kyc_status !== 'NOT_SUBMITTED';

  return {
    user: formatUserResponse(user),
    onboarding: {
      role_selected: true,
      kyc_submitted: kycSubmitted,
      kyc_status: user.kyc_status,
    },
  };
};

/**
 * Logout user
 * 
 * Logic:
 * 1. Clear FCM token from user record
 * 2. (Client should discard JWT token)
 */
const logout = async (userId) => {
  await User.update({ fcm_token: null }, { where: { id: userId } });
};

/**
 * Format user response
 */
const formatUserResponse = (user) => {
  return {
    id: user.id.toString(),
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
  verifyFirebaseToken,
  findUserByOnboardingToken,
  generateToken,
  verifyToken,
  loginOrRegister,
  selectRole,
  logout,
  formatUserResponse,
};
