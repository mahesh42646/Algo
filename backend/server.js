const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./middleware/logger');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables - check for production first, then fallback to .env.local
const envFile = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '.env.production')
  : path.join(__dirname, '.env.local');

// Try to load the appropriate env file, but don't fail if it doesn't exist
// Environment variables can also be set directly (e.g., via PM2 ecosystem file)
if (require('fs').existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
} else {
  // Fallback: try to load .env.local if .env.production doesn't exist
  const fallbackEnv = path.join(__dirname, '.env.local');
  if (require('fs').existsSync(fallbackEnv)) {
    require('dotenv').config({ path: fallbackEnv });
  } else {
    // If no env file exists, dotenv will use process.env (useful for PM2 with env vars)
    require('dotenv').config();
  }
}

const app = express();

const PORT = process.env.BACKEND_PORT || 4006;

// Security: Validate required environment variables
if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ CRITICAL: ENCRYPTION_KEY environment variable is required!');
  console.error('   Generate one with: openssl rand -base64 32');
  process.exit(1);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow ngrok if needed
}));

// CORS Configuration - more secure
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [];
    
    // In development, allow localhost and ngrok
    if (process.env.NODE_ENV === 'development') {
      if (!origin || 
          origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('ngrok') ||
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In production, only allow specified origins
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

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

// 404 handler (must be last)
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler - sanitize error messages to prevent information leakage
app.use((err, req, res, next) => {
  // Log full error for debugging (server-side only)
  console.error('[ERROR]', {
    message: err.message,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Don't expose sensitive error details to client
  const statusCode = err.status || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 && !isDevelopment 
      ? 'Internal Server Error' 
      : err.message || 'Internal Server Error',
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
