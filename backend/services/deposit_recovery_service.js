const Deposit = require('../schemas/deposit');
const User = require('../schemas/user');
const { processDeposit, updateLedgerBalance, addWalletTransaction } = require('./wallet_service');
const { checkAddressForDeposits } = require('./testnet_monitor');

// Recover missing deposits by checking blockchain and crediting users
const recoverMissingDeposits = async (userId = null) => {
  try {
    console.log(`[DEPOSIT RECOVERY] 🔍 Starting deposit recovery process...`);
    
    // Get all users or specific user
    const query = userId ? { userId } : {};
    const users = await User.find(query).select('userId wallet');
    
    let totalRecovered = 0;
    let totalCredited = 0;
    
    for (const user of users) {
      try {
        // Get user's deposit address
        const depositAddress = user.wallet?.tronTest?.address || user.wallet?.tronProd?.address;
        if (!depositAddress) {
          continue;
        }
        
        console.log(`[DEPOSIT RECOVERY] 🔍 Checking deposits for user ${user.userId} (address: ${depositAddress.substring(0, 8)}...)`);
        
        // Check blockchain for deposits
        const result = await checkAddressForDeposits(depositAddress, true);
        
        if (result.newDeposits > 0) {
          console.log(`[DEPOSIT RECOVERY] ✅ Found ${result.newDeposits} new deposits for user ${user.userId}`);
          totalRecovered += result.newDeposits;
        }
        
        // Check for deposits in database that weren't credited
        const uncreditedDeposits = await Deposit.find({
          userId: user.userId,
          balanceCredited: { $ne: true },
          status: { $ne: 'completed' },
        }).sort({ createdAt: -1 });
        
        if (uncreditedDeposits.length > 0) {
          console.log(`[DEPOSIT RECOVERY] 🔄 Found ${uncreditedDeposits.length} uncredited deposits for user ${user.userId}`);
          
          for (const deposit of uncreditedDeposits) {
            try {
              // Reload user to get latest data
              const freshUser = await User.findOne({ userId: user.userId });
              if (!freshUser) {
                console.log(`[DEPOSIT RECOVERY] ⚠️ User not found: ${user.userId}`);
                continue;
              }
              
              // Check if balance was already credited (maybe by another process)
              const currentBalance = freshUser.wallet?.balances?.find(b => b.currency === 'USDT')?.amount || 0;
              
              // Try to credit if not already done
              if (currentBalance < deposit.amount) {
                console.log(`[DEPOSIT RECOVERY] 💰 Crediting ${deposit.amount} USDT for deposit ${deposit.txHash.substring(0, 16)}...`);
                
                await updateLedgerBalance({ user: freshUser, amount: deposit.amount });
                await addWalletTransaction({ 
                  user: freshUser, 
                  amount: deposit.amount, 
                  txHash: deposit.txHash,
                  createdAt: deposit.createdAt,
                });
                
                freshUser.wallet.depositStatus = 'confirmed';
                await freshUser.save();
                
                deposit.balanceCredited = true;
                deposit.status = 'completed';
                deposit.error = null;
                await deposit.save();
                
                totalCredited++;
                console.log(`[DEPOSIT RECOVERY] ✅ Credited ${deposit.amount} USDT for deposit ${deposit.txHash.substring(0, 16)}...`);
              } else {
                console.log(`[DEPOSIT RECOVERY] ℹ️ Balance already has amount - marking as credited`);
                deposit.balanceCredited = true;
                deposit.status = 'completed';
                await deposit.save();
                totalCredited++;
              }
            } catch (recoverError) {
              console.error(`[DEPOSIT RECOVERY] ❌ Error recovering deposit ${deposit.txHash}:`, recoverError.message);
            }
          }
        }
      } catch (userError) {
        console.error(`[DEPOSIT RECOVERY] ❌ Error processing user ${user.userId}:`, userError.message);
      }
    }
    
    console.log(`[DEPOSIT RECOVERY] ✅ Recovery completed: ${totalRecovered} new deposits found, ${totalCredited} deposits credited`);
    return { 
      success: true, 
      newDeposits: totalRecovered, 
      credited: totalCredited 
    };
  } catch (error) {
    console.error(`[DEPOSIT RECOVERY] ❌ Recovery failed:`, error.message);
    throw error;
  }
};

// Find and credit specific missing deposits by txHash
const recoverDepositByTxHash = async (txHash) => {
  try {
    const deposit = await Deposit.findOne({ txHash });
    if (!deposit) {
      throw new Error('Deposit not found');
    }
    
    if (deposit.balanceCredited) {
      return { success: true, message: 'Deposit already credited' };
    }
    
    const user = await User.findOne({ userId: deposit.userId });
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check current balance
    const currentBalance = user.wallet?.balances?.find(b => b.currency === 'USDT')?.amount || 0;
    
    if (currentBalance < deposit.amount) {
      console.log(`[DEPOSIT RECOVERY] 💰 Recovering ${deposit.amount} USDT for tx ${txHash.substring(0, 16)}...`);
      
      await updateLedgerBalance({ user, amount: deposit.amount });
      await addWalletTransaction({ 
        user, 
        amount: deposit.amount, 
        txHash: deposit.txHash,
        createdAt: deposit.createdAt,
      });
      
      user.wallet.depositStatus = 'confirmed';
      await user.save();
      
      deposit.balanceCredited = true;
      deposit.status = 'completed';
      deposit.error = null;
      await deposit.save();
      
      console.log(`[DEPOSIT RECOVERY] ✅ Recovered ${deposit.amount} USDT for tx ${txHash.substring(0, 16)}...`);
      return { success: true, credited: deposit.amount };
    } else {
      deposit.balanceCredited = true;
      deposit.status = 'completed';
      await deposit.save();
      return { success: true, message: 'Balance already has amount' };
    }
  } catch (error) {
    console.error(`[DEPOSIT RECOVERY] ❌ Error recovering deposit:`, error.message);
    throw error;
  }
};

module.exports = {
  recoverMissingDeposits,
  recoverDepositByTxHash,
};
