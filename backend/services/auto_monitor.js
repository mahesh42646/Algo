const { checkAllUserDeposits } = require('./testnet_monitor');
const { getTatumMode } = require('./wallet_service');

let monitorInterval = null;
let isRunning = false;

// Start automatic deposit monitoring for testnet
const startAutoMonitoring = () => {
  const mode = getTatumMode();
  
  // Only run in test mode
  if (mode !== 'test') {
    console.log('[AUTO MONITOR] Not in test mode - skipping automatic monitoring');
    return;
  }

  // Prevent multiple instances
  if (isRunning) {
    console.log('[AUTO MONITOR] Already running');
    return;
  }

  const CHECK_INTERVAL = parseInt(process.env.TESTNET_CHECK_INTERVAL) || 15000; // 15 seconds default
  
  console.log(`[AUTO MONITOR] Starting automatic testnet monitoring (every ${CHECK_INTERVAL/1000}s)`);
  isRunning = true;

  // Run immediately on start
  checkAllUserDeposits().catch(err => {
    console.error('[AUTO MONITOR] Initial check failed:', err.message);
  });

  // Then run periodically
  monitorInterval = setInterval(async () => {
    try {
      if (mode !== getTatumMode()) {
        console.log('[AUTO MONITOR] Mode changed - stopping monitor');
        stopAutoMonitoring();
        return;
      }

      await checkAllUserDeposits();
      // Logging is handled inside checkAllUserDeposits (only when new deposits found)
    } catch (error) {
      console.error('[AUTO MONITOR] Check failed:', error.message);
    }
  }, CHECK_INTERVAL);

  console.log('[AUTO MONITOR] ✅ Automatic deposit detection enabled');
};

// Stop automatic monitoring
const stopAutoMonitoring = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    isRunning = false;
    console.log('[AUTO MONITOR] Stopped');
  }
};

// Get monitoring status
const getStatus = () => {
  return {
    running: isRunning,
    mode: getTatumMode(),
    interval: parseInt(process.env.TESTNET_CHECK_INTERVAL) || 15000,
  };
};

module.exports = {
  startAutoMonitoring,
  stopAutoMonitoring,
  getStatus,
};
