const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, AWS_BUCKET } = require('../config/aws');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Check if AWS is configured
const isAwsConfigured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

// Local uploads directory (relative to project root)
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Ensure local upload directory exists
 */
const ensureLocalDir = async (folder) => {
  const dirPath = path.join(LOCAL_UPLOADS_DIR, folder);
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
  return dirPath;
};

/**
 * Upload file to local storage
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder name (e.g., 'profiles', 'documents', 'cars')
 * @returns {Object} - { url, key }
 */
const uploadToLocal = async (file, folder) => {
  const dirPath = await ensureLocalDir(folder);
  
  const fileExtension = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExtension}`;
  const key = `${folder}/${fileName}`;
  const filePath = path.join(dirPath, fileName);

  // Write file to local storage
  await fs.writeFile(filePath, file.buffer);

  // Generate URL (will be served via static middleware)
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const url = `${baseUrl}/uploads/${key}`;

  return { url, key };
};

/**
 * Delete file from local storage
 * @param {string} key - File key (e.g., 'profiles/uuid.jpg')
 */
const deleteFromLocal = async (key) => {
  const filePath = path.join(LOCAL_UPLOADS_DIR, key);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, ignore error
    console.error('Error deleting local file:', error.message);
  }
};

/**
 * Upload file to S3
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder name in S3 (e.g., 'profiles', 'documents', 'cars')
 * @returns {Object} - { url, key }
 */
const uploadToS3Only = async (file, folder) => {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExtension}`;
  const key = `${folder}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: AWS_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  const url = `https://${AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { url, key };
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 */
const deleteFromS3Only = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: AWS_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Upload file - automatically chooses S3 or local based on configuration
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder name (e.g., 'profiles', 'documents', 'cars')
 * @returns {Object} - { url, key }
 */
const uploadToS3 = async (file, folder) => {
  if (isAwsConfigured()) {
    console.log(`[Upload] Using AWS S3 for ${folder}`);
    return uploadToS3Only(file, folder);
  } else {
    console.log(`[Upload] Using local storage for ${folder} (AWS not configured)`);
    return uploadToLocal(file, folder);
  }
};

/**
 * Delete file - automatically chooses S3 or local based on URL
 * @param {string} key - File key
 */
const deleteFromS3 = async (key) => {
  if (isAwsConfigured()) {
    return deleteFromS3Only(key);
  } else {
    return deleteFromLocal(key);
  }
};

/**
 * Extract key from URL (works for both S3 and local URLs)
 * @param {string} url - Full URL
 * @returns {string} - File key
 */
const getKeyFromUrl = (url) => {
  if (!url) return null;
  
  // Check if it's an S3 URL
  if (url.includes('.amazonaws.com/')) {
    const urlParts = url.split('.amazonaws.com/');
    return urlParts.length > 1 ? urlParts[1] : null;
  }
  
  // Check if it's a local URL
  if (url.includes('/uploads/')) {
    const urlParts = url.split('/uploads/');
    return urlParts.length > 1 ? urlParts[1] : null;
  }
  
  return null;
};

/**
 * Get storage type being used
 * @returns {string} - 'S3' or 'LOCAL'
 */
const getStorageType = () => {
  return isAwsConfigured() ? 'S3' : 'LOCAL';
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getKeyFromUrl,
  getStorageType,
  isAwsConfigured,
};
