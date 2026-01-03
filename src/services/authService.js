const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');
const { User, Role } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
 * Generate JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    roleId: user.role_id,
    roleCode: user.role?.code || null,
    kycStatus: user.kyc_status,
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
 * 6. Generate JWT token
 * 7. Build onboarding status for Flutter navigation
 * 8. Return token, user data, and onboarding status
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

  // Step 6: Generate JWT token
  const token = generateToken(user);

  // Step 7: Build onboarding status
  const onboarding = {
    role_selected: !!user.role_id,
    kyc_submitted: user.kyc_status !== 'PENDING' || user.full_name !== null,
    kyc_status: user.kyc_status,
  };

  // Step 8: Return response
  return {
    isNewUser,
    token,
    user: formatUserResponse(user),
    onboarding,
  };
};

/**
 * Select user role
 * 
 * Logic:
 * 1. Validate role code exists in database
 * 2. Update user's role_id
 * 3. Return updated user data
 */
const selectRole = async (userId, roleCode) => {
  // Step 1: Find role
  const role = await Role.findOne({ where: { code: roleCode } });
  if (!role) {
    throw new Error('Invalid role');
  }

  // Step 2: Update user
  await User.update({ role_id: role.id }, { where: { id: userId } });

  // Step 3: Get and return updated user
  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: 'role' }],
  });

  return formatUserResponse(user);
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
  verifyFirebaseToken,
  generateToken,
  verifyToken,
  loginOrRegister,
  selectRole,
  logout,
  formatUserResponse,
};
