const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, AWS_BUCKET } = require('../config/aws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload file to S3
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder name in S3 (e.g., 'profiles', 'documents', 'cars')
 * @returns {Object} - { url, key }
 */
const uploadToS3 = async (file, folder) => {
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
const deleteFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: AWS_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Extract key from S3 URL
 * @param {string} url - Full S3 URL
 * @returns {string} - S3 key
 */
const getKeyFromUrl = (url) => {
  if (!url) return null;
  const urlParts = url.split('.amazonaws.com/');
  return urlParts.length > 1 ? urlParts[1] : null;
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getKeyFromUrl,
};
