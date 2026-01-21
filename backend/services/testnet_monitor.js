const axios = require('axios');
const User = require('../schemas/user');
const Deposit = require('../schemas/deposit');
const { processDeposit, getTatumMode } = require('./wallet_service');

// Nile Testnet API
const NILE_API = 'https://nile.trongrid.io';

// Poll a specific address for new TRC20 transactions
const checkAddressForDeposits = async (address, silent = false) => {
  try {
    // Get TRC20 transactions for this address
    const response = await axios({
      method: 'get',
      url: `${NILE_API}/v1/accounts/${address}/transactions/trc20`,
      params: {
        limit: 20,
        only_to: true,  // Only incoming transactions
      },
      timeout: 10000,
    });

    const transactions = response.data?.data || [];
    let newDepositsFound = 0;

    for (const tx of transactions) {
      // Check if it's USDT and incoming to this address
      if (tx.to === address && tx.token_info?.symbol === 'USDT') {
        const txHash = tx.transaction_id;
        
        // Check if this transaction has already been processed
        const existingDeposit = await Deposit.findOne({ txHash });
        if (existingDeposit) {
          // Skip already processed transactions (no logging for duplicates)
          continue;
        }

        // This is a NEW deposit!
        const amount = parseFloat(tx.value) / Math.pow(10, tx.token_info.decimals || 6);
        newDepositsFound++;
        
        console.log(`[DEPOSIT] 💰 NEW ${amount} USDT from ${tx.from.substring(0, 8)}... → ${tx.to.substring(0, 8)}...`);

        // Try to process this deposit
        try {
          await processDeposit({
            address: tx.to,
            txHash,
            amount,
            chain: 'TRON_TESTNET',
            token: 'USDT',
            contractAddress: tx.token_info.address,
          });
        } catch (processError) {
          console.error(`[DEPOSIT] ❌ Processing failed:`, processError.message);
        }
      }
    }

    return { 
      success: true, 
      transactionCount: transactions.length,
      newDeposits: newDepositsFound,
    };
  } catch (error) {
    if (!silent) {
      console.error(`[TESTNET MONITOR] Error checking address:`, error.message);
    }
    return { success: false, error: error.message };
  }
};

// Check all user addresses for new deposits
const checkAllUserDeposits = async () => {
  try {
    const mode = getTatumMode();
    if (mode !== 'test') {
      return { skipped: true, reason: 'Not in test mode' };
    }

    const walletKey = 'tronTest';
    
    // Find all users with test addresses
    const users = await User.find({
      [`wallet.${walletKey}.address`]: { $exists: true, $ne: null },
    });

    const results = [];
    let totalNewDeposits = 0;

    for (const user of users) {
      const address = user.wallet[walletKey]?.address;
      if (address) {
        const result = await checkAddressForDeposits(address, true); // silent mode
        if (result.newDeposits > 0) {
          totalNewDeposits += result.newDeposits;
        }
        results.push({
          userId: user.userId,
          address,
          ...result,
        });
      }
    }

    // Only log summary if new deposits were found
    if (totalNewDeposits > 0) {
      console.log(`[AUTO MONITOR] ✅ ${totalNewDeposits} new deposit(s) processed`);
    }

    return {
      success: true,
      totalUsers: users.length,
      newDeposits: totalNewDeposits,
      results,
    };
  } catch (error) {
    console.error(`[TESTNET MONITOR] Error:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  checkAddressForDeposits,
  checkAllUserDeposits,
};
