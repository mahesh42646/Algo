const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const { subscribeToAddressMonitoring, listSubscriptions, deleteSubscription } = require('../services/webhook_subscription');
const { getTatumMode } = require('../services/wallet_service');
const { checkAddressForDeposits, checkAllUserDeposits } = require('../services/testnet_monitor');
const autoMonitor = require('../services/auto_monitor');

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

module.exports = router;
