const { sanitizeObject } = require('../utils/encryption');

const logger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  
  // Sanitize headers (remove authorization tokens)
  const sanitizedHeaders = { ...req.headers };
  if (sanitizedHeaders.authorization) {
    sanitizedHeaders.authorization = '****';
  }
  if (sanitizedHeaders['x-api-key']) {
    sanitizedHeaders['x-api-key'] = '****';
  }
  console.log(`Headers:`, JSON.stringify(sanitizedHeaders, null, 2));
  
  // Sanitize request body to remove sensitive data
  if (Object.keys(req.body || {}).length > 0) {
    const sanitizedBody = sanitizeObject(req.body);
    console.log(`Body:`, JSON.stringify(sanitizedBody, null, 2));
  }
  
  // Sanitize query parameters
  if (Object.keys(req.query || {}).length > 0) {
    const sanitizedQuery = sanitizeObject(req.query);
    console.log(`Query:`, JSON.stringify(sanitizedQuery, null, 2));
  }

  const originalSend = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const status = statusCode >= 200 && statusCode < 300 ? '✅ SUCCESS' : '❌ ERROR';
    
    console.log(`[${timestamp}] ${status} ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
    
    // Sanitize response data to prevent logging sensitive information
    const sanitizedResponse = sanitizeObject(data);
    console.log(`Response:`, JSON.stringify(sanitizedResponse, null, 2));
    console.log('─'.repeat(80));
    
    return originalSend.call(this, data);
  };

  const originalSendStatus = res.sendStatus;
  res.sendStatus = function(statusCode) {
    const duration = Date.now() - startTime;
    const status = statusCode >= 200 && statusCode < 300 ? '✅ SUCCESS' : '❌ ERROR';
    
    console.log(`[${timestamp}] ${status} ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
    console.log('─'.repeat(80));
    
    return originalSendStatus.call(this, statusCode);
  };

  next();
};

module.exports = logger;
