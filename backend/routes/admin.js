const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const { subscribeToAddressMonitoring, listSubscriptions, deleteSubscription } = require('../services/webhook_subscription');
const { getTatumMode } = require('../services/wallet_service');
const { checkAddressForDeposits, checkAllUserDeposits } = require('../services/testnet_monitor');

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

module.exports = router;
