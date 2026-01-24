const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const Admin = require('../schemas/admin');
const { subscribeToAddressMonitoring, listSubscriptions, deleteSubscription } = require('../services/webhook_subscription');
const { getTatumMode } = require('../services/wallet_service');
const { checkAddressForDeposits, checkAllUserDeposits } = require('../services/testnet_monitor');
const autoMonitor = require('../services/auto_monitor');
const { authenticateAdmin, generateAdminToken } = require('../middleware/auth');

// ============================================
// ADMIN AUTHENTICATION ROUTES
// ============================================

/**
 * POST /api/admin/login
 * Authenticate admin with username and password
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Find admin by username (with password field)
    const admin = await Admin.findByUsername(username);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Admin account is deactivated',
      });
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin.username);

    // Return success response with admin data (without password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error('[ADMIN LOGIN] Error:', error);
    next(error);
  }
});

/**
 * GET /api/admin/profile
 * Get authenticated admin profile
 */
router.get('/profile', authenticateAdmin, async (req, res, next) => {
  try {
    // Admin is attached to req by authenticateAdmin middleware
    const admin = req.admin;

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          isActive: admin.isActive,
          dashboardName: admin.dashboardName || 'Admin Dashboard',
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('[ADMIN PROFILE] Error:', error);
    next(error);
  }
});

/**
 * PUT /api/admin/profile
 * Update admin username and/or password
 */
router.put('/profile', authenticateAdmin, async (req, res, next) => {
  try {
    const { username, email, password, currentPassword, dashboardName } = req.body;
    const admin = req.admin;

    // Validate that at least one field is being updated
    if (!username && !email && !password && !dashboardName) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (username, email, password, or dashboardName) must be provided',
      });
    }

    // If updating password, current password is required
    if (password && !currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password is required to update password',
      });
    }

    // Verify current password if updating password
    if (password && currentPassword) {
      // Need to fetch admin with password field
      const adminWithPassword = await Admin.findById(admin._id).select('+password');
      const isCurrentPasswordValid = await adminWithPassword.comparePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
        });
      }

      // Update password
      adminWithPassword.password = password;
      await adminWithPassword.save();
    }

    // Update username if provided
    if (username) {
      // Check if username is already taken by another admin
      const existingAdmin = await Admin.findOne({
        username: username.toLowerCase(),
        _id: { $ne: admin._id },
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: 'Username is already taken',
        });
      }

      admin.username = username.toLowerCase();
    }

    // Update email if provided
    if (email) {
      // Check if email is already taken by another admin
      const existingAdmin = await Admin.findOne({
        email: email.toLowerCase(),
        _id: { $ne: admin._id },
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken',
        });
      }

      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }

      admin.email = email.toLowerCase();
    }

    // Save admin if username or email was updated
    if (username || email) {
      await admin.save();
    }

    // Handle dashboard name (store in admin document or separate config)
    // For now, we'll add it to the admin document as a preference
    if (dashboardName !== undefined) {
      admin.dashboardName = dashboardName;
      await admin.save();
    }

    // Fetch updated admin (without password)
    const updatedAdmin = await Admin.findById(admin._id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: {
          id: updatedAdmin._id,
          username: updatedAdmin.username,
          email: updatedAdmin.email,
          isActive: updatedAdmin.isActive,
          dashboardName: updatedAdmin.dashboardName || 'Admin Dashboard',
          lastLogin: updatedAdmin.lastLogin,
          createdAt: updatedAdmin.createdAt,
          updatedAt: updatedAdmin.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('[ADMIN UPDATE PROFILE] Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }

    // Handle duplicate key error (username already exists)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Username is already taken',
      });
    }

    next(error);
  }
});

// ============================================
// ADMIN MANAGEMENT ROUTES (Protected)
// ============================================

// Subscribe all user addresses to webhook monitoring
router.post('/subscribe-all-addresses', async (req, res, next) => {
  try {
    const mode = getTatumMode();
    const walletKey = mode === 'production' ? 'tronProd' : 'tronTest';

    // Find all users with addresses
    const users = await User.find({
      [`wallet.${walletKey}.address`]: { $exists: true, $ne: null },
    });

    console.log(`[ADMIN] Found ${users.length} users with ${mode} addresses to subscribe`);

    const results = [];
    for (const user of users) {
      const address = user.wallet[walletKey]?.address;
      if (address) {
        const result = await subscribeToAddressMonitoring(address);
        results.push({
          userId: user.userId,
          address,
          ...result,
        });
      }
    }

    res.json({
      success: true,
      mode,
      totalUsers: users.length,
      results,
    });
  } catch (error) {
    console.error('[ADMIN] Error subscribing addresses:', error);
    next(error);
  }
});

// List all active webhook subscriptions
router.get('/subscriptions', async (req, res, next) => {
  try {
    const subscriptions = await listSubscriptions();
    res.json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    console.error('[ADMIN] Error listing subscriptions:', error);
    next(error);
  }
});

// Delete a specific subscription
router.delete('/subscription/:id', async (req, res, next) => {
  try {
    await deleteSubscription(req.params.id);
    res.json({
      success: true,
      message: 'Subscription deleted',
    });
  } catch (error) {
    console.error('[ADMIN] Error deleting subscription:', error);
    next(error);
  }
});

// Check for testnet deposits (manual polling)
router.post('/check-testnet-deposits', async (req, res, next) => {
  try {
    const result = await checkAllUserDeposits();
    res.json(result);
  } catch (error) {
    console.error('[ADMIN] Error checking deposits:', error);
    next(error);
  }
});

// Check specific address for deposits
router.post('/check-address/:address', async (req, res, next) => {
  try {
    const result = await checkAddressForDeposits(req.params.address);
    res.json(result);
  } catch (error) {
    console.error('[ADMIN] Error checking address:', error);
    next(error);
  }
});

// Manual sweep for a specific user (force sweep regardless of amount)
router.post('/sweep-user/:userId', async (req, res, next) => {
  try {
    const { forceAmount } = req.body;
    const user = await User.findOne({ userId: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const walletKey = getTatumMode() === 'production' ? 'tronProd' : 'tronTest';
    const address = user.wallet[walletKey]?.address;
    
    if (!address) {
      return res.status(400).json({ success: false, error: 'No wallet address found' });
    }

    const unsweptFunds = forceAmount || user.wallet.unsweptFunds || 0;
    
    if (unsweptFunds <= 0) {
      return res.json({ success: false, error: 'No funds to sweep', unsweptFunds });
    }

    // TODO: Implement manual sweep logic
    // For security, this should be authenticated with admin-only access
    
    res.json({
      success: true,
      message: 'Manual sweep initiated',
      userId: user.userId,
      address,
      amountToSweep: unsweptFunds,
    });
  } catch (error) {
    console.error('[ADMIN] Error sweeping user funds:', error);
    next(error);
  }
});

// Get sweep statistics
router.get('/sweep-stats', async (req, res, next) => {
  try {
    const users = await User.find({
      'wallet.unsweptFunds': { $gt: 0 },
    }).select('userId email wallet.unsweptFunds wallet.totalSwept wallet.lastSweepAt');

    const totalUnswept = users.reduce((sum, u) => sum + (u.wallet.unsweptFunds || 0), 0);
    const totalSwept = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$wallet.totalSwept' } } },
    ]);

    res.json({
      success: true,
      usersWithUnsweptFunds: users.length,
      totalUnsweptFunds: totalUnswept,
      totalSweptAllTime: totalSwept[0]?.total || 0,
      users: users.map(u => ({
        userId: u.userId,
        email: u.email,
        unsweptFunds: u.wallet.unsweptFunds,
        totalSwept: u.wallet.totalSwept,
        lastSweepAt: u.wallet.lastSweepAt,
      })),
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching sweep stats:', error);
    next(error);
  }
});

// Get auto-monitor status
router.get('/monitor-status', async (req, res, next) => {
  try {
    const status = autoMonitor.getStatus();
    res.json({
      success: true,
      ...status,
      message: status.running 
        ? `Automatic monitoring active - checking every ${status.interval/1000}s` 
        : 'Automatic monitoring disabled (production mode or not started)',
    });
  } catch (error) {
    console.error('[ADMIN] Error getting monitor status:', error);
    next(error);
  }
});

// ============================================
// ALGO TRADING ADMIN ROUTES
// ============================================

const algoTradingRoutes = require('./algo_trading');

// Get all active algo trades
router.get('/algo-trades', authenticateAdmin, async (req, res, next) => {
  try {
    const activeTrades = algoTradingRoutes.getActiveTrades();
    const trades = [];
    
    for (const [key, trade] of activeTrades.entries()) {
      if (trade.isActive) {
        trades.push({
          tradeKey: key,
          userId: trade.userId,
          symbol: trade.symbol,
          platform: trade.platform,
          currentLevel: trade.currentLevel,
          numberOfLevels: trade.numberOfLevels,
          isStarted: trade.isStarted,
          tradeDirection: trade.tradeDirection,
          startedAt: trade.startedAt,
          lastSignal: trade.lastSignal,
          totalInvested: trade.totalInvested,
          platformWalletFees: trade.platformWalletFees.reduce((a, b) => a + b, 0),
        });
      }
    }
    
    console.log(`[ADMIN ALGO TRADES] 📊 Admin ${req.admin.username} viewed all active trades: ${trades.length}`);
    
    res.json({
      success: true,
      count: trades.length,
      trades,
    });
  } catch (error) {
    console.error('[ADMIN] Error getting algo trades:', error);
    next(error);
  }
});

// Stop a specific algo trade
router.post('/algo-trades/stop', authenticateAdmin, async (req, res, next) => {
  try {
    const { userId, symbol } = req.body;
    
    if (!userId || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'userId and symbol are required',
      });
    }
    
    const activeTrades = algoTradingRoutes.getActiveTrades();
    const tradeKey = `${userId}:${symbol.toUpperCase()}`;
    const trade = activeTrades.get(tradeKey);
    
    if (!trade || !trade.isActive) {
      return res.status(404).json({
        success: false,
        error: 'No active trade found for this user and symbol',
      });
    }
    
    // Stop the interval
    if (trade.intervalId) {
      clearInterval(trade.intervalId);
    }
    
    // Mark as inactive
    trade.isActive = false;
    trade.stoppedAt = new Date();
    trade.stopReason = 'admin_stopped';
    trade.stoppedBy = req.admin.username;
    
    activeTrades.delete(tradeKey);
    
    // Add notification to user
    const user = await User.findOne({ userId }).select('notifications');
    if (user) {
      user.notifications.push({
        title: `Algo Trading Stopped by Admin 🛑`,
        message: `Your algo trade for ${trade.symbol} has been stopped by an administrator.`,
        type: 'warning',
        read: false,
        createdAt: new Date(),
      });
      await user.save();
    }
    
    console.log(`[ADMIN ALGO TRADES] 🛑 Admin ${req.admin.username} stopped trade: ${tradeKey}`);
    
    res.json({
      success: true,
      message: 'Trade stopped successfully',
      trade: {
        symbol: trade.symbol,
        userId: trade.userId,
        stoppedAt: trade.stoppedAt,
        stoppedBy: trade.stoppedBy,
      },
    });
  } catch (error) {
    console.error('[ADMIN] Error stopping algo trade:', error);
    next(error);
  }
});

// Stop all trades for a specific user
router.post('/algo-trades/stop-user/:userId', authenticateAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const activeTrades = algoTradingRoutes.getActiveTrades();
    
    const stoppedTrades = [];
    for (const [key, trade] of activeTrades.entries()) {
      if (trade.userId === userId && trade.isActive) {
        // Stop the interval
        if (trade.intervalId) {
          clearInterval(trade.intervalId);
        }
        
        trade.isActive = false;
        trade.stoppedAt = new Date();
        trade.stopReason = 'admin_stopped_all';
        trade.stoppedBy = req.admin.username;
        
        stoppedTrades.push({
          symbol: trade.symbol,
          tradeKey: key,
        });
        
        activeTrades.delete(key);
      }
    }
    
    // Add notification to user
    if (stoppedTrades.length > 0) {
      const user = await User.findOne({ userId }).select('notifications');
      if (user) {
        user.notifications.push({
          title: `All Algo Trades Stopped by Admin 🛑`,
          message: `All your algo trades (${stoppedTrades.length}) have been stopped by an administrator.`,
          type: 'warning',
          read: false,
          createdAt: new Date(),
        });
        await user.save();
      }
    }
    
    console.log(`[ADMIN ALGO TRADES] 🛑 Admin ${req.admin.username} stopped ${stoppedTrades.length} trades for user ${userId}`);
    
    res.json({
      success: true,
      message: `Stopped ${stoppedTrades.length} trade(s)`,
      stoppedCount: stoppedTrades.length,
      trades: stoppedTrades,
    });
  } catch (error) {
    console.error('[ADMIN] Error stopping user trades:', error);
    next(error);
  }
});

// Stop all active trades system-wide
router.post('/algo-trades/stop-all', authenticateAdmin, async (req, res, next) => {
  try {
    const activeTrades = algoTradingRoutes.getActiveTrades();
    const stoppedTrades = [];
    const userIds = new Set();
    
    for (const [key, trade] of activeTrades.entries()) {
      if (trade.isActive) {
        // Stop the interval
        if (trade.intervalId) {
          clearInterval(trade.intervalId);
        }
        
        trade.isActive = false;
        trade.stoppedAt = new Date();
        trade.stopReason = 'admin_stopped_all_system';
        trade.stoppedBy = req.admin.username;
        
        stoppedTrades.push({
          userId: trade.userId,
          symbol: trade.symbol,
          tradeKey: key,
        });
        
        userIds.add(trade.userId);
        activeTrades.delete(key);
      }
    }
    
    // Add notifications to all affected users
    if (userIds.size > 0) {
      const users = await User.find({ userId: { $in: Array.from(userIds) } }).select('userId notifications');
      for (const user of users) {
        const userTrades = stoppedTrades.filter(t => t.userId === user.userId);
        if (userTrades.length > 0) {
          user.notifications.push({
            title: `All Algo Trades Stopped by Admin 🛑`,
            message: `All your algo trades (${userTrades.length}) have been stopped by an administrator.`,
            type: 'warning',
            read: false,
            createdAt: new Date(),
          });
          await user.save();
        }
      }
    }
    
    console.log(`[ADMIN ALGO TRADES] 🛑 Admin ${req.admin.username} stopped ALL ${stoppedTrades.length} active trades system-wide`);
    
    res.json({
      success: true,
      message: `Stopped ${stoppedTrades.length} trade(s) system-wide`,
      stoppedCount: stoppedTrades.length,
      affectedUsers: userIds.size,
      trades: stoppedTrades,
    });
  } catch (error) {
    console.error('[ADMIN] Error stopping all trades:', error);
    next(error);
  }
});

module.exports = router;
