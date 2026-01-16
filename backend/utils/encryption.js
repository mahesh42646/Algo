const crypto = require('crypto');

// Get encryption key from environment - MUST be 32 bytes (256 bits) for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required. Generate with: openssl rand -base64 32');
}

// Validate key length (should be 32 bytes for AES-256)
// If provided as base64, decode it; if hex, use as is; otherwise derive from string
let keyBuffer;
try {
  // Try to decode as base64 first
  keyBuffer = Buffer.from(ENCRYPTION_KEY, 'base64');
  if (keyBuffer.length !== 32) {
    // If not base64 or wrong length, try hex
    keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
    if (keyBuffer.length !== 32) {
      // If still not 32 bytes, derive using PBKDF2
      keyBuffer = crypto.pbkdf2Sync(ENCRYPTION_KEY, 'algobot-salt', 100000, 32, 'sha256');
    }
  }
} catch (e) {
  // If decoding fails, derive from string
  keyBuffer = crypto.pbkdf2Sync(ENCRYPTION_KEY, 'algobot-salt', 100000, 32, 'sha256');
}

// Use AES-256-GCM for authenticated encryption (more secure than CBC)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted data in format: iv:authTag:encryptedData (all hex)
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input for encryption');
  }

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encryptedData (all in hex)
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:encryptedData
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Invalid input for decryption');
  }

  try {
    const parts = encryptedData.split(':');
    
    // Handle new format: iv:authTag:encryptedData (3 parts)
    if (parts.length === 3) {
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }
    
    // Handle old format: iv:encryptedData (2 parts) - for backward compatibility
    // Note: This is for migration purposes only
    if (parts.length === 2) {
      throw new Error('Old encryption format detected. Please re-enter your API credentials to upgrade to secure encryption.');
    }
    
    throw new Error('Invalid encrypted data format');
  } catch (error) {
    // Provide user-friendly error message
    if (error.message.includes('Old encryption format')) {
      throw error;
    }
    throw new Error('Decryption failed. The data may be corrupted or encrypted with a different key.');
  }
}

/**
 * Mask API key for display (show first 4 and last 4 characters)
 * @param {string} apiKey - API key to mask
 * @returns {string} - Masked API key
 */
function maskApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return '****';
  }
  if (apiKey.length <= 8) {
    return '****';
  }
  return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
}

/**
 * Sanitize object by removing or masking sensitive fields
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sensitiveFields = ['apiKey', 'apiSecret', 'password', 'secret', 'token', 'accessToken', 'refreshToken', 'privateKey'];
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 0) {
        sanitized[key] = maskApiKey(sanitized[key]);
      } else {
        sanitized[key] = '****';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}

module.exports = {
  encrypt,
  decrypt,
  maskApiKey,
  sanitizeObject,
};
