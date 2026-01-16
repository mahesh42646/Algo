/**
 * Rate limiting middleware
 * Prevents abuse and brute force attacks
 */

const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Clean up old entries
    if (requests.has(key)) {
      const entry = requests.get(key);
      if (now - entry.resetTime > windowMs) {
        requests.delete(key);
      }
    }

    // Get or create entry
    let entry = requests.get(key);
    if (!entry || now - entry.resetTime > windowMs) {
      entry = {
        count: 0,
        resetTime: now,
      };
      requests.set(key, entry);
    }

    // Increment count
    entry.count++;

    // Check limit
    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((windowMs - (now - entry.resetTime)) / 1000),
      });
    }

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - entry.count),
      'X-RateLimit-Reset': new Date(entry.resetTime + windowMs).toISOString(),
    });

    next();
  };
};

module.exports = rateLimit;
