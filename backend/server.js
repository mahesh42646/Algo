const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./middleware/logger');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();

const PORT = process.env.BACKEND_PORT || 4006;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow ngrok
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Allow all origins for ngrok
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
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
