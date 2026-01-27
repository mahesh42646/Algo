const Deposit = require('../schemas/deposit');
const User = require('../schemas/user');
const { processDeposit, updateLedgerBalance, addWalletTransaction } = require('./wallet_service');

let retryInterval = null;
const MAX_RETRIES = 10; // Maximum number of retry attempts
const RETRY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Retry failed deposits that haven't been credited
const retryFailedDeposits = async () => {
  try {
    // Find deposits that failed and balance was not credited
    // Also retry deposits that are in 'detected' status for more than 5 minutes (might have failed silently)
    const fiveMinutesAgo = new Date(Date.now() - RETRY_INTERVAL_MS);
    
    const failedDeposits = await Deposit.find({
      $or: [
        { 
          status: 'failed',
          balanceCredited: false,
          retryCount: { $lt: MAX_RETRIES }
        },
        {
          status: 'detected',
          balanceCredited: false,
          createdAt: { $lt: fiveMinutesAgo },
          retryCount: { $lt: MAX_RETRIES }
        }
      ]
    }).sort({ createdAt: 1 }).limit(20); // Process max 20 at a time
    
    if (failedDeposits.length === 0) {
      return { retried: 0, success: 0, failed: 0 };
    }
    
    console.log(`[DEPOSIT RETRY] 🔄 Found ${failedDeposits.length} deposits to retry`);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const deposit of failedDeposits) {
      try {
        // Check if user exists
        const user = await User.findOne({ userId: deposit.userId });
        if (!user) {
          console.log(`[DEPOSIT RETRY] ⏭️ User not found for deposit ${deposit.txHash} - skipping`);
          deposit.status = 'failed';
          deposit.error = 'User not found';
          await deposit.save();
          continue;
        }
        
        // Check if balance was already credited (maybe by another process)
        const currentBalance = user.wallet?.balances?.find(b => b.currency === 'USDT')?.amount || 0;
        if (currentBalance >= deposit.amount) {
          console.log(`[DEPOSIT RETRY] ✅ Balance already credited for ${deposit.txHash} - marking as completed`);
          deposit.balanceCredited = true;
          deposit.status = 'completed';
          deposit.error = null;
          await deposit.save();
          successCount++;
          continue;
        }
        
        // Update retry tracking
        deposit.retryCount = (deposit.retryCount || 0) + 1;
        deposit.lastRetryAt = new Date();
        deposit.status = 'retrying';
        await deposit.save();
        
        console.log(`[DEPOSIT RETRY] 🔄 Retrying deposit ${deposit.txHash} (attempt ${deposit.retryCount}/${MAX_RETRIES})`);
        
        // Retry processing the deposit
        const result = await processDeposit({
          address: deposit.address,
          txHash: deposit.txHash,
          amount: deposit.amount,
          chain: deposit.chain,
          token: deposit.token,
          contractAddress: deposit.contractAddress,
        });
        
        if (result?.success || result?.balanceCredited) {
          console.log(`[DEPOSIT RETRY] ✅ Successfully retried deposit ${deposit.txHash}`);
          successCount++;
        } else {
          console.log(`[DEPOSIT RETRY] ⚠️ Retry attempt ${deposit.retryCount} failed for ${deposit.txHash}`);
          failedCount++;
        }
      } catch (retryError) {
        console.error(`[DEPOSIT RETRY] ❌ Error retrying deposit ${deposit.txHash}:`, retryError.message);
        failedCount++;
        
        // Update deposit status
        deposit.status = 'failed';
        deposit.error = `Retry ${deposit.retryCount} failed: ${retryError.message}`;
        await deposit.save();
      }
    }
    
    console.log(`[DEPOSIT RETRY] ✅ Retry cycle completed: ${successCount} succeeded, ${failedCount} still failed`);
    return { retried: failedDeposits.length, success: successCount, failed: failedCount };
  } catch (error) {
    console.error(`[DEPOSIT RETRY] ❌ Error in retry service:`, error.message);
    return { retried: 0, success: 0, failed: 0, error: error.message };
  }
};

// Start the retry service
const startRetryService = () => {
  if (retryInterval) {
    console.log('[DEPOSIT RETRY] Service already running');
    return;
  }
  
  console.log(`[DEPOSIT RETRY] 🚀 Starting deposit retry service (every ${RETRY_INTERVAL_MS / 1000 / 60} minutes)`);
  
  // Run immediately on start
  retryFailedDeposits().catch(err => {
    console.error('[DEPOSIT RETRY] Initial retry failed:', err.message);
  });
  
  // Then run periodically
  retryInterval = setInterval(async () => {
    try {
      await retryFailedDeposits();
    } catch (error) {
      console.error('[DEPOSIT RETRY] Periodic retry failed:', error.message);
    }
  }, RETRY_INTERVAL_MS);
  
  console.log('[DEPOSIT RETRY] ✅ Retry service started');
};

// Stop the retry service
const stopRetryService = () => {
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
    console.log('[DEPOSIT RETRY] Service stopped');
  }
};

// Manual retry for a specific deposit (for admin use)
const retryDeposit = async (txHash) => {
  const deposit = await Deposit.findOne({ txHash });
  if (!deposit) {
    throw new Error('Deposit not found');
  }
  
  if (deposit.balanceCredited) {
    return { success: true, message: 'Balance already credited' };
  }
  
  if (deposit.retryCount >= MAX_RETRIES) {
    throw new Error(`Maximum retries (${MAX_RETRIES}) reached`);
  }
  
  const user = await User.findOne({ userId: deposit.userId });
  if (!user) {
    throw new Error('User not found');
  }
  
  deposit.retryCount = (deposit.retryCount || 0) + 1;
  deposit.lastRetryAt = new Date();
  deposit.status = 'retrying';
  await deposit.save();
  
  const result = await processDeposit({
    address: deposit.address,
    txHash: deposit.txHash,
    amount: deposit.amount,
    chain: deposit.chain,
    token: deposit.token,
    contractAddress: deposit.contractAddress,
  });
  
  return result;
};

module.exports = {
  startRetryService,
  stopRetryService,
  retryFailedDeposits,
  retryDeposit,
};
