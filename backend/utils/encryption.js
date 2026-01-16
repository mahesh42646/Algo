const crypto = require('crypto');

/**
 * Secure 256-bit AES encryption utility
 * Uses AES-256-GCM for authenticated encryption
 */

// Validate encryption key - must be exactly 32 bytes (256 bits)
function validateEncryptionKey(key) {
  if (!key) {
    throw new Error('ENCRYPTION_KEY is required in environment variables');
  }
  
  // Convert to buffer to check actual byte length
  const keyBuffer = Buffer.from(key, 'utf8');
  
  if (keyBuffer.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be exactly 32 bytes (256 bits). Current length: ${keyBuffer.length} bytes. Generate with: openssl rand -hex 32`);
  }
  
  return keyBuffer;
}

// Get encryption key from environment
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required. Generate with: openssl rand -hex 32');
  }
  return validateEncryptionKey(key);
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {string} - Encrypted data in format: iv:authTag:encryptedData (all hex)
 */
function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a non-empty string');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // 128-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag (16 bytes for GCM)
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encryptedData (all in hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    // Never expose encryption errors with sensitive details
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:encryptedData
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Encrypted data must be a non-empty string');
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Never expose decryption errors with sensitive details
    throw new Error('Decryption failed - invalid or corrupted data');
  }
}

/**
 * Mask sensitive data for logging/display
 * Shows first 4 and last 4 characters
 */
function maskSensitiveData(data) {
  if (!data || typeof data !== 'string') {
    return '****';
  }
  
  if (data.length <= 8) {
    return '****';
  }
  
  return data.substring(0, 4) + '****' + data.substring(data.length - 4);
}

module.exports = {
  encrypt,
  decrypt,
  maskSensitiveData,
  validateEncryptionKey,
  getEncryptionKey,
};
