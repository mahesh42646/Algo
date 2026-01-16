/**
 * Utility to sanitize sensitive data from objects for logging
 */

const SENSITIVE_FIELDS = [
  'apiKey',
  'apiSecret',
  'secret',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'auth',
  'credentials',
  'privateKey',
  'private_key',
  'secretKey',
  'secret_key',
];

/**
 * Recursively sanitize sensitive fields from an object
 * @param {any} obj - Object to sanitize
 * @param {number} depth - Current recursion depth (prevents infinite loops)
 * @returns {any} - Sanitized object
 */
function sanitizeForLogging(obj, depth = 0) {
  // Prevent deep recursion
  if (depth > 10) {
    return '[Max depth reached]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, depth + 1));
  }

  // Handle objects
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if this is a sensitive field
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      // Mask sensitive values
      if (typeof value === 'string' && value.length > 0) {
        if (value.length <= 8) {
          sanitized[key] = '****';
        } else {
          sanitized[key] = value.substring(0, 4) + '****' + value.substring(value.length - 4);
        }
      } else {
        sanitized[key] = '****';
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLogging(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize headers object (removes authorization and other sensitive headers)
 */
function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }

  const sanitized = { ...headers };
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
  ];

  for (const header of sensitiveHeaders) {
    const lowerHeader = header.toLowerCase();
    for (const key in sanitized) {
      if (key.toLowerCase() === lowerHeader) {
        sanitized[key] = '****';
      }
    }
  }

  return sanitized;
}

module.exports = {
  sanitizeForLogging,
  sanitizeHeaders,
  SENSITIVE_FIELDS,
};
