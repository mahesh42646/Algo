const User = require('../schemas/user');
const Deposit = require('../schemas/deposit');
const { encrypt, decrypt } = require('../utils/encryption');
const {
  getTatumMode,
  getTronChainName,
  generateTronWallet,
  getMasterWallet,
  sendTrx,
  sendUsdtTrc20,
  getTronAccount,
  getUsdtContract,
} = require('./tatum_service');
const { subscribeToAddressMonitoring } = require('./webhook_subscription');

const MIN_DEPOSIT_USDT = parseFloat(process.env.TATUM_MIN_DEPOSIT_USDT || '100');
const TRX_GAS_AMOUNT = parseFloat(process.env.TATUM_TRX_GAS_AMOUNT || '35');
const TRX_DUST_AMOUNT = parseFloat(process.env.TATUM_TRX_DUST_AMOUNT || '1');

const ensureUserTronWallet = async (userId) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new Error('User not found');
  }

  const mode = getTatumMode();
  const walletKey = mode === 'production' ? 'tronProd' : 'tronTest';

  if (user.wallet?.[walletKey]?.address && user.wallet?.[walletKey]?.privateKeyEncrypted) {
    return user.wallet[walletKey].address;
  }

  const wallet = await generateTronWallet();
  const encryptedKey = encrypt(wallet.privateKey);

  if (!user.wallet) {
    user.wallet = {};
  }
  user.wallet[walletKey] = {
    address: wallet.address,
    privateKeyEncrypted: encryptedKey,
    createdAt: new Date(),
  };
  await user.save();

  console.log(`[WALLET] ✅ TRON wallet created for user ${userId} in ${mode} mode:`, wallet.address);

  // Subscribe to webhook monitoring for this address (non-blocking)
  subscribeToAddressMonitoring(wallet.address).then((result) => {
    if (result.success) {
      console.log(`[WALLET] ✅ Webhook subscription active for ${wallet.address}`);
    } else {
      console.log(`[WALLET] ⚠️  Webhook subscription failed for ${wallet.address}: ${result.error}`);
    }
  }).catch((err) => {
    console.error(`[WALLET] ❌ Webhook subscription error:`, err.message);
  });

  return wallet.address;
};

const findUserByDepositAddress = async (address) => {
  return User.findOne({
    $or: [
      { 'wallet.tronTest.address': address },
      { 'wallet.tronProd.address': address },
    ],
  });
};

const getUserPrivateKey = (user) => {
  const mode = getTatumMode();
  const walletKey = mode === 'production' ? 'tronProd' : 'tronTest';
  if (!user.wallet?.[walletKey]?.privateKeyEncrypted) {
    throw new Error('User TRON private key not found');
  }
  return decrypt(user.wallet[walletKey].privateKeyEncrypted);
};

const updateLedgerBalance = async ({ user, amount }) => {
  if (!user.wallet) {
    user.wallet = {};
  }
  if (!user.wallet.balances) {
    user.wallet.balances = [];
  }

  const existing = user.wallet.balances.find(
    (b) => b.currency === 'USDT'
  );
  if (existing) {
    existing.amount = (existing.amount || 0) + amount;
  } else {
    user.wallet.balances.push({ currency: 'USDT', amount });
  }

  user.wallet.depositStatus = 'confirmed';
  await user.save();
};

const addWalletTransaction = async ({ user, amount, txHash }) => {
  if (!user.wallet) {
    user.wallet = {};
  }
  if (!user.wallet.transactions) {
    user.wallet.transactions = [];
  }

  user.wallet.transactions.push({
    type: 'deposit',
    amount,
    currency: 'USDT',
    status: 'completed',
    description: `USDT deposit confirmed (tx: ${txHash})`,
  });
  user.wallet.lastDepositTx = txHash;
  await user.save();
};

const processDeposit = async ({ address, txHash, amount, chain, token, contractAddress }) => {
  const user = await findUserByDepositAddress(address);
  if (!user) {
    return { ignored: true, reason: 'Address not found' };
  }

  // In test mode, accept any deposit amount
  // In production mode, enforce minimum deposit
  const mode = getTatumMode();
  const minDeposit = mode === 'production' ? MIN_DEPOSIT_USDT : 0.01;
  
  if (amount < minDeposit) {
    return { ignored: true, reason: `Below minimum deposit (${minDeposit} USDT)` };
  }

  let deposit = await Deposit.findOne({ txHash });
  if (deposit && deposit.status === 'completed') {
    return { ignored: true, reason: 'Already processed' };
  }

  if (!deposit) {
    deposit = await Deposit.create({
      userId: user.userId,
      address,
      txHash,
      chain,
      token,
      contractAddress,
      amount,
      status: 'detected',
    });
  }

  // STEP 1: IMMEDIATELY credit user's platform wallet balance (BEFORE ANYTHING ELSE)
  // This MUST happen first and be saved to database before any sweep attempts
  let balanceCredited = false;
  try {
    // Reload user to ensure we have latest data
    const freshUser = await User.findOne({ userId: user.userId });
    if (!freshUser) {
      throw new Error('User not found');
    }
    
    await updateLedgerBalance({ user: freshUser, amount });
    await addWalletTransaction({ user: freshUser, amount, txHash });
    
    freshUser.wallet.depositStatus = 'confirmed';
    await freshUser.save();
    
    balanceCredited = true;
    deposit.balanceCredited = true;
    deposit.status = 'completed'; // Mark as completed since balance is credited
    await deposit.save();
    
    console.log(`[DEPOSIT] ✅ ${amount} USDT credited to user platform wallet IMMEDIATELY (before sweep)`);
    console.log(`[DEPOSIT] ✅ User balance updated and saved to database`);
    
    // Update local user reference
    user = freshUser;
  } catch (creditError) {
    console.error(`[DEPOSIT] ❌ CRITICAL: Failed to credit balance: ${creditError.message}`);
    console.error(`[DEPOSIT] ❌ Stack:`, creditError.stack);
    deposit.balanceCredited = false;
    deposit.error = `Balance credit failed: ${creditError.message}`;
    await deposit.save();
    // Don't throw - let retry service handle it
    return { success: false, balanceCredited: false, error: creditError.message };
  }
  
  try {
    
    // STEP 2: Add notification for deposit (balance already credited)
    const userForNotification = await User.findOne({ userId: user.userId });
    if (userForNotification) {
      if (!userForNotification.notifications) {
        userForNotification.notifications = [];
      }
      userForNotification.notifications.push({
        title: '✅ Deposit Received',
        message: `You have received ${amount} USDT. Your balance has been updated.`,
        type: 'success',
        read: false,
        createdAt: new Date(),
      });
      await userForNotification.save();
    }

    // STEP 3: Attempt to sweep funds to master wallet (this is SEPARATE and OPTIONAL)
    // Balance is already credited, so sweep can fail without affecting user
    const masterWallet = getMasterWallet();
    if (!masterWallet.address || !masterWallet.privateKey) {
      console.warn(`[SWEEP] ⚠️ Master wallet not configured - funds remain in user address but balance is credited`);
      deposit.status = 'completed';
      deposit.balanceCredited = true;
      deposit.error = 'Master wallet not configured - balance credited but sweep skipped';
      await deposit.save();
      console.log(`[DEPOSIT] ✅ Deposit completed: ${amount} USDT credited (sweep skipped)`);
      return { success: true, swept: false, balanceCredited: true, reason: 'Master wallet not configured' };
    }

    // Reload user to get latest balance info
    const userForSweep = await User.findOne({ userId: user.userId });
    if (!userForSweep) {
      console.error(`[SWEEP] ⚠️ User not found for sweep - but balance already credited`);
      deposit.status = 'completed';
      deposit.balanceCredited = true;
      await deposit.save();
      return { success: true, swept: false, balanceCredited: true };
    }

    // Update unswept funds
    const currentUnswept = userForSweep.wallet.unsweptFunds || 0;
    const newUnsweptTotal = currentUnswept + amount;
    
    const shouldSweep = newUnsweptTotal >= MIN_DEPOSIT_USDT;

    if (shouldSweep) {
      console.log(`[SWEEP] Total unswept funds (${newUnsweptTotal} USDT) >= ${MIN_DEPOSIT_USDT} USDT - initiating sweep`);
      console.log(`[SWEEP] ℹ️ NOTE: User balance already credited - sweep is separate operation`);
      
      try {
        // Step 1: Fund user wallet with TRX for gas (only if sweeping)
        await sendTrx({
          fromPrivateKey: masterWallet.privateKey,
          to: address,
          amount: TRX_GAS_AMOUNT,
        });
        deposit.status = 'gas_funded';
        await deposit.save();

        // Step 2: Sweep ALL unswept USDT to master wallet
        const userPrivateKey = getUserPrivateKey(userForSweep);
        deposit.status = 'sweeping';
        await deposit.save();
        
        await sendUsdtTrc20({
          fromPrivateKey: userPrivateKey,
          to: masterWallet.address,
          amount: newUnsweptTotal, // Sweep all unswept funds
        });

        // Step 3: Reclaim TRX (leave dust)
        const account = await getTronAccount(address);
        const trxBalance = parseFloat(account?.balance || 0);
        const reclaimAmount = trxBalance - TRX_DUST_AMOUNT;
        if (reclaimAmount > 0) {
          await sendTrx({
            fromPrivateKey: userPrivateKey,
            to: masterWallet.address,
            amount: reclaimAmount,
          });
        }
        
        // Update sweep tracking
        userForSweep.wallet.unsweptFunds = 0;
        userForSweep.wallet.totalSwept = (userForSweep.wallet.totalSwept || 0) + newUnsweptTotal;
        userForSweep.wallet.lastSweepAt = new Date();
        await userForSweep.save();
        
        deposit.status = 'swept';
        deposit.balanceCredited = true; // Ensure marked
        await deposit.save();
        console.log(`[SWEEP] ✅ Swept ${newUnsweptTotal} USDT to master wallet`);
      } catch (sweepError) {
        // If sweep fails, user balance is ALREADY credited - just log the error
        console.error(`[SWEEP] ❌ Sweep failed: ${sweepError.message}`);
        console.error(`[SWEEP] ⚠️ User balance ALREADY CREDITED. Funds remain in user address: ${address}`);
        console.error(`[SWEEP] ⚠️ User can use their ${amount} USDT in platform wallet`);
        deposit.status = 'sweep_failed';
        deposit.error = `Sweep failed: ${sweepError.message}. User balance already credited.`;
        deposit.balanceCredited = true; // CRITICAL: Ensure this is marked
        await deposit.save();
        // Keep unswept funds tracked - will retry on next deposit
        userForSweep.wallet.unsweptFunds = newUnsweptTotal;
        await userForSweep.save();
      }
    } else {
      // Small deposits: hold in user address and track unswept
      userForSweep.wallet.unsweptFunds = newUnsweptTotal;
      await userForSweep.save();
      deposit.status = 'held';
      deposit.balanceCredited = true; // Balance is credited even if held
      await deposit.save();
      console.log(`[DEPOSIT] Unswept funds: ${newUnsweptTotal} USDT (waiting for ${MIN_DEPOSIT_USDT} USDT to auto-sweep)`);
    }

    // Final status update - ensure balanceCredited is true
    deposit.status = 'completed';
    deposit.balanceCredited = true;
    deposit.error = null; // Clear any previous errors
    await deposit.save();

    console.log(`[DEPOSIT] ✅ Deposit processing completed: ${amount} USDT credited to user platform wallet`);
    return { success: true, swept: shouldSweep, balanceCredited: true };
  } catch (error) {
    // This catch should rarely be hit since balance credit happens first
    // But if it is, try to credit the user if not already done
    console.error(`[DEPOSIT] ❌ Error in deposit processing: ${error.message}`);
    console.error(`[DEPOSIT] ❌ Stack:`, error.stack);
    
    let balanceCredited = deposit.balanceCredited || false;
    
    // Double-check if balance was actually credited by checking user's current balance
    if (!balanceCredited) {
      try {
        const freshUser = await User.findOne({ userId: user.userId });
        if (freshUser) {
          const currentBalance = freshUser.wallet?.balances?.find(b => b.currency === 'USDT')?.amount || 0;
          // Check if user already has this amount (maybe credited in a previous attempt)
          const hasAmount = currentBalance >= amount;
          
          if (!hasAmount) {
            console.log(`[DEPOSIT] ⚠️ CRITICAL: Balance not credited! Attempting emergency credit...`);
            await updateLedgerBalance({ user: freshUser, amount });
            await addWalletTransaction({ user: freshUser, amount, txHash });
            freshUser.wallet.depositStatus = 'confirmed';
            await freshUser.save();
            
            balanceCredited = true;
            deposit.balanceCredited = true;
            console.log(`[DEPOSIT] ✅ User balance credited as emergency fallback`);
          } else {
            console.log(`[DEPOSIT] ℹ️ User already has balance - marking as credited`);
            balanceCredited = true;
            deposit.balanceCredited = true;
          }
        }
      } catch (fallbackError) {
        console.error(`[DEPOSIT] ❌ CRITICAL: Emergency fallback credit also failed: ${fallbackError.message}`);
        balanceCredited = false;
      }
    }
    
    // Mark deposit status based on whether balance was credited
    if (balanceCredited) {
      deposit.status = 'completed'; // Mark as completed since balance is credited
      deposit.error = `Processing had issues but balance credited: ${error.message}`;
      console.log(`[DEPOSIT] ✅ Deposit marked as completed - balance was credited`);
    } else {
      deposit.status = 'failed'; // Failed and balance not credited - needs retry
      deposit.error = error.message;
      console.error(`[DEPOSIT] ❌ Deposit failed - balance NOT credited - will retry`);
    }
    await deposit.save();
    
    // Update user status
    const userForStatus = await User.findOne({ userId: user.userId });
    if (userForStatus && userForStatus.wallet) {
      userForStatus.wallet.depositStatus = balanceCredited ? 'confirmed' : 'failed';
      await userForStatus.save();
    }
    
    // If balance was credited, return success (deposit succeeded for user)
    if (balanceCredited) {
      console.log(`[DEPOSIT] ⚠️ Deposit completed with issues: balance credited but some processing failed`);
      return { success: true, balanceCredited: true, error: error.message };
    }
    
    // If balance not credited, throw error so retry service can handle it
    throw error;
  }
};

const normalizeWebhookPayload = (payload) => {
  const address = payload.address || payload.receiver || payload.to;
  const txHash = payload.txId || payload.txHash || payload.transactionId || payload.hash;
  const chain = payload.chain || payload.network || payload.blockchain;
  const token = payload.token || payload.asset || payload.currency;
  const amount = parseFloat(payload.amount || payload.value || '0');
  const contractAddress = payload.contractAddress || payload.tokenAddress || payload.contract;

  return { address, txHash, chain, token, amount, contractAddress };
};

const isValidUsdtTrc20Deposit = ({ chain, token, contractAddress }) => {
  const mode = getTatumMode();
  const expectedToken = 'USDT';
  const expectedContract = getUsdtContract();

  const chainOk = chain && chain.toUpperCase().includes('TRON');
  const tokenOk = token && (token.toUpperCase() === expectedToken || token.toUpperCase().includes('USDT'));
  
  // In test mode, be more lenient with contract validation
  const contractOk = mode === 'test' 
    ? true  // Accept any TRC20 USDT on testnet
    : expectedContract
      ? (contractAddress || '').toLowerCase() === expectedContract.toLowerCase()
      : true;

  console.log(`[VALIDATION] Chain: ${chainOk}, Token: ${tokenOk}, Contract: ${contractOk}, Mode: ${mode}`);
  return chainOk && tokenOk && contractOk;
};

module.exports = {
  ensureUserTronWallet,
  processDeposit,
  normalizeWebhookPayload,
  isValidUsdtTrc20Deposit,
  getTatumMode,
};
