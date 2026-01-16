const { sanitizeForLogging, sanitizeHeaders } = require('../utils/sanitize');

const logger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Sanitize headers before logging
  const sanitizedHeaders = sanitizeHeaders(req.headers);
  
  console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  console.log(`Headers:`, JSON.stringify(sanitizedHeaders, null, 2));
  
  // Sanitize body before logging (removes apiKey, apiSecret, etc.)
  if (Object.keys(req.body || {}).length > 0) {
    const sanitizedBody = sanitizeForLogging(req.body);
    console.log(`Body:`, JSON.stringify(sanitizedBody, null, 2));
  }
  
  // Sanitize query params
  if (Object.keys(req.query || {}).length > 0) {
    const sanitizedQuery = sanitizeForLogging(req.query);
    console.log(`Query:`, JSON.stringify(sanitizedQuery, null, 2));
  }

  const originalSend = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const status = statusCode >= 200 && statusCode < 300 ? '✅ SUCCESS' : '❌ ERROR';
    
    // Sanitize response data before logging
    const sanitizedResponse = sanitizeForLogging(data);
    
    console.log(`[${timestamp}] ${status} ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
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
