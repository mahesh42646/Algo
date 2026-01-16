const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./middleware/logger');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
// Use 3001 to avoid conflict with ngrok web interface (4040)
const PORT = process.env.BACKEND_PORT || 3001;

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

// MongoDB connection options for better reliability
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('⚠️  Server will continue but database operations will fail');
    console.error('   Please check your MONGODB_URI:', MONGODB_URI);
    // Don't exit - allow server to start even if DB is down
    // This prevents 502 errors when DB is temporarily unavailable
  });

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
  console.log('[HEALTH CHECK] ✅ Health check requested from:', req.ip, req.path);
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    message: 'Server is running',
    database: dbStatus,
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
  console.log(`   Use this IP in mobile app .env: ${localIP}`);
});

module.exports = app;
