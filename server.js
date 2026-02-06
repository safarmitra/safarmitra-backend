require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initializeFirebase } = require('./src/config/firebase');
const { initializeServices } = require('./src/services/serviceSetup');

const PORT = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';

// Start server
const startServer = async () => {
  try {
    // Initialize Firebase
    initializeFirebase();

    // Initialize service dependencies (resolves circular dependencies)
    initializeServices();

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${env}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();
