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

  try {
    // STEP 1: IMMEDIATELY credit user's platform wallet balance (before any sweep attempts)
    // This ensures user gets their balance even if sweep fails
    await updateLedgerBalance({ user, amount });
    await addWalletTransaction({ user, amount, txHash });
    
    user.wallet.depositStatus = 'confirmed';
    await user.save();
    
    console.log(`[DEPOSIT] ✅ ${amount} USDT credited to user platform wallet immediately`);
    
    // STEP 2: Add notification for deposit
    if (!user.notifications) {
      user.notifications = [];
    }
    user.notifications.push({
      title: '✅ Deposit Received',
      message: `You have received ${amount} USDT. Your balance has been updated.`,
      type: 'success',
      read: false,
      createdAt: new Date(),
    });
    await user.save();

    // STEP 3: Attempt to sweep funds to master wallet (this is separate from crediting user)
    const masterWallet = getMasterWallet();
    if (!masterWallet.address || !masterWallet.privateKey) {
      console.warn(`[SWEEP] ⚠️ Master wallet not configured - funds remain in user address but balance is credited`);
      deposit.status = 'completed';
      deposit.error = 'Master wallet not configured - balance credited but sweep skipped';
      await deposit.save();
      return { success: true, swept: false, reason: 'Master wallet not configured' };
    }

    // Update unswept funds
    const currentUnswept = user.wallet.unsweptFunds || 0;
    const newUnsweptTotal = currentUnswept + amount;
    
    const shouldSweep = newUnsweptTotal >= MIN_DEPOSIT_USDT;

    if (shouldSweep) {
      console.log(`[SWEEP] Total unswept funds (${newUnsweptTotal} USDT) >= ${MIN_DEPOSIT_USDT} USDT - initiating sweep`);
      
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
        const userPrivateKey = getUserPrivateKey(user);
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
        user.wallet.unsweptFunds = 0;
        user.wallet.totalSwept = (user.wallet.totalSwept || 0) + newUnsweptTotal;
        user.wallet.lastSweepAt = new Date();
        await user.save();
        
        deposit.status = 'swept';
        await deposit.save();
        console.log(`[SWEEP] ✅ Swept ${newUnsweptTotal} USDT to master wallet`);
      } catch (sweepError) {
        // If sweep fails, user balance is already credited - just log the error
        console.error(`[SWEEP] ❌ Sweep failed: ${sweepError.message}`);
        console.error(`[SWEEP] ⚠️ User balance already credited. Funds remain in user address: ${address}`);
        deposit.status = 'sweep_failed';
        deposit.error = `Sweep failed: ${sweepError.message}. User balance already credited.`;
        await deposit.save();
        // Keep unswept funds tracked - will retry on next deposit
        user.wallet.unsweptFunds = newUnsweptTotal;
        await user.save();
      }
    } else {
      // Small deposits: hold in user address and track unswept
      user.wallet.unsweptFunds = newUnsweptTotal;
      await user.save();
      deposit.status = 'held';
      await deposit.save();
      console.log(`[DEPOSIT] Unswept funds: ${newUnsweptTotal} USDT (waiting for ${MIN_DEPOSIT_USDT} USDT to auto-sweep)`);
    }

    deposit.status = 'completed';
    await deposit.save();

    console.log(`[DEPOSIT] ✅ Deposit processing completed: ${amount} USDT credited to user`);
    return { success: true, swept: shouldSweep };
  } catch (error) {
    // Even if there's an error, try to credit the user if not already done
    try {
      const currentBalance = user.wallet?.balances?.find(b => b.currency === 'USDT')?.amount || 0;
      if (currentBalance < amount) {
        console.log(`[DEPOSIT] ⚠️ Error occurred but attempting to credit user balance as fallback`);
        await updateLedgerBalance({ user, amount });
        await addWalletTransaction({ user, amount, txHash });
        user.wallet.depositStatus = 'confirmed';
        await user.save();
        console.log(`[DEPOSIT] ✅ User balance credited as fallback`);
      }
    } catch (fallbackError) {
      console.error(`[DEPOSIT] ❌ Fallback credit also failed: ${fallbackError.message}`);
    }
    
    deposit.status = 'failed';
    deposit.error = error.message;
    await deposit.save();
    if (user.wallet) {
      user.wallet.depositStatus = 'failed';
      await user.save();
    }
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
