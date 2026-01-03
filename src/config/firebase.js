const admin = require('firebase-admin');

const initializeFirebase = () => {
  // Check if Firebase is already initialized
  if (admin.apps.length > 0) {
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // If Firebase credentials are not provided, skip initialization
  // This allows the app to run without Firebase for development/testing
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️  Firebase credentials not provided. Firebase features will be disabled.');
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('✅ Firebase initialized successfully');
    return admin;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    return null;
  }
};

module.exports = {
  initializeFirebase,
  admin,
};
