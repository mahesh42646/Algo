const { sanitizeForLogging, sanitizeHeaders } = require('../utils/sanitize');

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const SLOW_REQUEST_MS = parseInt(process.env.SLOW_REQUEST_MS || '2000', 10);

const shouldLogDebug = LOG_LEVEL === 'debug';
const shouldLogInfo = LOG_LEVEL === 'info' || shouldLogDebug;
const shouldLogError = LOG_LEVEL === 'error' || shouldLogInfo;

const logger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  if (shouldLogDebug) {
    const sanitizedHeaders = sanitizeHeaders(req.headers);
    console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
    console.log(`Headers:`, JSON.stringify(sanitizedHeaders, null, 2));

    if (Object.keys(req.body || {}).length > 0) {
      const sanitizedBody = sanitizeForLogging(req.body);
      console.log(`Body:`, JSON.stringify(sanitizedBody, null, 2));
    }

    if (Object.keys(req.query || {}).length > 0) {
      const sanitizedQuery = sanitizeForLogging(req.query);
      console.log(`Query:`, JSON.stringify(sanitizedQuery, null, 2));
    }
  }

  const originalSend = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;
    const isSlow = duration >= SLOW_REQUEST_MS;

    if ((isError && shouldLogError) || (isSlow && shouldLogInfo) || shouldLogDebug) {
      const status = statusCode >= 200 && statusCode < 300 ? '✅ SUCCESS' : '❌ ERROR';
      console.log(`[${timestamp}] ${status} ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);

      if (shouldLogDebug) {
        const sanitizedResponse = sanitizeForLogging(data);
        console.log(`Response:`, JSON.stringify(sanitizedResponse, null, 2));
      }
      console.log('─'.repeat(80));
    }

    return originalSend.call(this, data);
  };

  const originalSendStatus = res.sendStatus;
  res.sendStatus = function(statusCode) {
    const duration = Date.now() - startTime;
    const isError = statusCode >= 400;
    const isSlow = duration >= SLOW_REQUEST_MS;

    if ((isError && shouldLogError) || (isSlow && shouldLogInfo) || shouldLogDebug) {
      const status = statusCode >= 200 && statusCode < 300 ? '✅ SUCCESS' : '❌ ERROR';
      console.log(`[${timestamp}] ${status} ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
      console.log('─'.repeat(80));
    }

    return originalSendStatus.call(this, statusCode);
  };

  next();
};

module.exports = logger;
