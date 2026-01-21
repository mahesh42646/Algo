const axios = require('axios');
const User = require('../schemas/user');
const { processDeposit, getTatumMode } = require('./wallet_service');

// Nile Testnet API
const NILE_API = 'https://nile.trongrid.io';

// Poll a specific address for new TRC20 transactions
const checkAddressForDeposits = async (address) => {
  try {
    console.log(`[TESTNET MONITOR] Checking address: ${address}`);
    
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
    console.log(`[TESTNET MONITOR] Found ${transactions.length} TRC20 transactions for ${address}`);

    for (const tx of transactions) {
      // Check if it's USDT and incoming to this address
      if (tx.to === address && tx.token_info?.symbol === 'USDT') {
        const amount = parseFloat(tx.value) / Math.pow(10, tx.token_info.decimals || 6);
        
        console.log(`[TESTNET MONITOR] Found USDT deposit:`, {
          txHash: tx.transaction_id,
          amount,
          from: tx.from,
          to: tx.to,
          timestamp: tx.block_timestamp,
        });

        // Try to process this deposit
        try {
          await processDeposit({
            address: tx.to,
            txHash: tx.transaction_id,
            amount,
            chain: 'TRON_TESTNET',
            token: 'USDT',
            contractAddress: tx.token_info.address,
          });
        } catch (processError) {
          console.error(`[TESTNET MONITOR] Error processing deposit:`, processError.message);
        }
      }
    }

    return { success: true, transactionCount: transactions.length };
  } catch (error) {
    console.error(`[TESTNET MONITOR] Error checking address:`, error.message);
    return { success: false, error: error.message };
  }
};

// Check all user addresses for new deposits
const checkAllUserDeposits = async () => {
  try {
    const mode = getTatumMode();
    if (mode !== 'test') {
      console.log(`[TESTNET MONITOR] Skipping - not in test mode`);
      return { skipped: true, reason: 'Not in test mode' };
    }

    const walletKey = 'tronTest';
    
    // Find all users with test addresses
    const users = await User.find({
      [`wallet.${walletKey}.address`]: { $exists: true, $ne: null },
    });

    console.log(`[TESTNET MONITOR] Checking ${users.length} user addresses for deposits`);

    const results = [];
    for (const user of users) {
      const address = user.wallet[walletKey]?.address;
      if (address) {
        const result = await checkAddressForDeposits(address);
        results.push({
          userId: user.userId,
          address,
          ...result,
        });
      }
    }

    return {
      success: true,
      totalUsers: users.length,
      results,
    };
  } catch (error) {
    console.error(`[TESTNET MONITOR] Error:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  checkAddressForDeposits,
  checkAllUserDeposits,
};
