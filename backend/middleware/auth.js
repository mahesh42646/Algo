const Admin = require('../schemas/admin');

/**
 * Authentication middleware for admin routes
 * Validates admin session/token and attaches admin to request
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header (Bearer token) or session
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers['x-admin-token']) {
      token = req.headers['x-admin-token'];
    } else if (req.session && req.session.adminToken) {
      token = req.session.adminToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please login.',
      });
    }

    // For now, we'll use a simple token validation
    // In production, you might want to use JWT tokens
    // For this implementation, we'll decode the token to get admin ID
    try {
      // Simple token format: base64(username:timestamp)
      // In production, use JWT with proper signing
      let decoded;
      try {
        decoded = Buffer.from(token, 'base64').toString('utf-8');
      } catch (base64Error) {
        console.error('[AUTH MIDDLEWARE] Base64 decode error:', base64Error.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication token format.',
        });
      }

      const parts = decoded.split(':');
      if (parts.length !== 2) {
        console.error('[AUTH MIDDLEWARE] Invalid token format - expected username:timestamp');
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication token format.',
        });
      }

      const [username, timestamp] = parts;
      
      if (!username || !timestamp) {
        console.error('[AUTH MIDDLEWARE] Missing username or timestamp in token');
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication token format.',
        });
      }

      // Check if token is not expired (24 hours)
      const tokenTimestamp = parseInt(timestamp, 10);
      if (isNaN(tokenTimestamp)) {
        console.error('[AUTH MIDDLEWARE] Invalid timestamp in token:', timestamp);
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication token format.',
        });
      }

      const tokenAge = Date.now() - tokenTimestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > maxAge) {
        return res.status(401).json({
          success: false,
          error: 'Session expired. Please login again.',
        });
      }

      // Find admin by username
      const admin = await Admin.findOne({ username: username.toLowerCase(), isActive: true });
      
      if (!admin) {
        console.error('[AUTH MIDDLEWARE] Admin not found for username:', username.toLowerCase());
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication token.',
        });
      }

      // Attach admin to request (without password)
      req.admin = admin;
      next();
    } catch (decodeError) {
      console.error('[AUTH MIDDLEWARE] Token validation error:', decodeError);
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token format.',
      });
    }
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error. Please try again.',
    });
  }
};

/**
 * Generate a simple token for admin session
 * In production, use JWT with proper signing
 */
const generateAdminToken = (username) => {
  const timestamp = Date.now().toString();
  const tokenData = `${username}:${timestamp}`;
  return Buffer.from(tokenData).toString('base64');
};

module.exports = {
  authenticateAdmin,
  generateAdminToken,
};
