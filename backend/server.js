const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./middleware/logger');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validate encryption key on startup
try {
  const { validateEncryptionKey } = require('./utils/encryption');
  if (process.env.ENCRYPTION_KEY) {
    validateEncryptionKey(process.env.ENCRYPTION_KEY);
    console.log('✅ Encryption key validated (256-bit)');
  } else {
    console.error('❌ ENCRYPTION_KEY is required in .env file');
    console.error('   Generate with: openssl rand -hex 32');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Encryption key validation failed:', error.message);
  process.exit(1);
}

const app = express();

const PORT = process.env.BACKEND_PORT || 4006;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow ngrok
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Allow all origins for ngrok
  credentials: true
}));
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for API routes
const rateLimiter = require('./middleware/rateLimiter');
const RATE_LIMIT_WINDOW = (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000; // Convert minutes to ms
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
app.use('/api', rateLimiter(RATE_LIMIT_WINDOW, RATE_LIMIT_MAX));

// Custom logger middleware (always enabled for API routes)
app.use('/api', logger);

if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use(morgan('dev'));
}

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/algobot';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
  console.log('[HEALTH CHECK] ✅ Health check requested from:', req.ip, req.path);
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/test', require('./routes/test'));
app.use('/api/users', require('./routes/user'));
app.use('/api/exchange', require('./routes/exchange'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/admin', require('./routes/admin'));

// 404 handler (must be last)
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  // Don't log sensitive error details
  const errorMessage = err.message || 'Internal Server Error';
  
  // Only log error message, not full stack or sensitive data
  console.error(`[ERROR] ${req.method} ${req.path}:`, errorMessage);
  
  // Don't expose internal errors to client
  const isDevelopment = process.env.NODE_ENV === 'development';
  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 && !isDevelopment 
      ? 'Internal Server Error' 
      : errorMessage,
    ...(isDevelopment && { stack: err.stack })
  });
});

// Start server - listen on all interfaces (0.0.0.0) to allow network access
const server = app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Find local network IP address
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Network access: http://${localIP}:${PORT}/api`);
  console.log(`   Use this IP in mobile app .env.local: ${localIP}`);
});

module.exports = app;
