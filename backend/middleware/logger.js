const logger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
  
  if (Object.keys(req.body || {}).length > 0) {
    console.log(`Body:`, JSON.stringify(req.body, null, 2));
  }
  
  if (Object.keys(req.query || {}).length > 0) {
    console.log(`Query:`, JSON.stringify(req.query, null, 2));
  }

  const originalSend = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const status = statusCode >= 200 && statusCode < 300 ? '✅ SUCCESS' : '❌ ERROR';
    
    console.log(`[${timestamp}] ${status} ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
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
