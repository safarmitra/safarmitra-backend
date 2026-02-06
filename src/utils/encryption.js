/**
 * Encryption utility for sensitive data (document numbers)
 * Uses AES-256-GCM for authenticated encryption
 */

const crypto = require('crypto');

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag

/**
 * Get encryption key from environment
 * Key must be 32 bytes (256 bits) for AES-256
 */
const getEncryptionKey = () => {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('DOCUMENT_ENCRYPTION_KEY environment variable is not set');
  }
  
  // If key is not 32 bytes, derive a 32-byte key using SHA-256
  if (key.length !== 32) {
    return crypto.createHash('sha256').update(key).digest();
  }
  
  return Buffer.from(key, 'utf8');
};

/**
 * Encrypt a string using AES-256-GCM
 * 
 * @param {string} plaintext - The text to encrypt
 * @returns {string} - Base64 encoded encrypted string (iv:authTag:ciphertext)
 */
const encrypt = (plaintext) => {
  if (!plaintext) {
    return null;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv + authTag + ciphertext, separated by colons
    // Format: base64(iv):base64(authTag):base64(ciphertext)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt a string encrypted with AES-256-GCM
 * 
 * @param {string} encryptedData - Base64 encoded encrypted string (iv:authTag:ciphertext)
 * @returns {string} - Decrypted plaintext
 */
const decrypt = (encryptedData) => {
  if (!encryptedData) {
    return null;
  }

  try {
    const key = getEncryptionKey();
    
    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    // Return null instead of throwing to handle gracefully
    return null;
  }
};

/**
 * Check if encryption key is configured
 * @returns {boolean}
 */
const isEncryptionConfigured = () => {
  return !!process.env.DOCUMENT_ENCRYPTION_KEY;
};

module.exports = {
  encrypt,
  decrypt,
  isEncryptionConfigured,
};
