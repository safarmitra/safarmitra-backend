const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, AWS_BUCKET } = require('../config/aws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Validate AWS S3 configuration
 * Throws error if not configured
 */
const validateAwsConfig = () => {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('AWS_ACCESS_KEY_ID is not configured');
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS_SECRET_ACCESS_KEY is not configured');
  }
  if (!process.env.AWS_S3_BUCKET) {
    throw new Error('AWS_S3_BUCKET is not configured');
  }
  if (!process.env.AWS_REGION) {
    throw new Error('AWS_REGION is not configured');
  }
};

/**
 * Upload file to S3
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder name in S3 (e.g., 'profiles', 'documents', 'cars')
 * @returns {Object} - { url, key }
 */
const uploadToS3 = async (file, folder) => {
  // Validate AWS configuration
  validateAwsConfig();

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

  console.log(`[Upload] File uploaded to S3: ${key}`);

  return { url, key };
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 */
const deleteFromS3 = async (key) => {
  if (!key) return;

  // Validate AWS configuration
  validateAwsConfig();

  const command = new DeleteObjectCommand({
    Bucket: AWS_BUCKET,
    Key: key,
  });

  await s3Client.send(command);

  console.log(`[Upload] File deleted from S3: ${key}`);
};

/**
 * Extract key from S3 URL
 * @param {string} url - Full S3 URL
 * @returns {string} - File key
 */
const getKeyFromUrl = (url) => {
  if (!url) return null;

  // S3 URL format: https://bucket-name.s3.region.amazonaws.com/key
  if (url.includes('.amazonaws.com/')) {
    const urlParts = url.split('.amazonaws.com/');
    return urlParts.length > 1 ? urlParts[1] : null;
  }

  return null;
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getKeyFromUrl,
};
