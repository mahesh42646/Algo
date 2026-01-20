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

const MIN_DEPOSIT_USDT = parseFloat(process.env.TATUM_MIN_DEPOSIT_USDT || '100');
const TRX_GAS_AMOUNT = parseFloat(process.env.TATUM_TRX_GAS_AMOUNT || '35');
const TRX_DUST_AMOUNT = parseFloat(process.env.TATUM_TRX_DUST_AMOUNT || '1');

const ensureUserTronWallet = async (userId) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.wallet?.tron?.address && user.wallet?.tron?.privateKeyEncrypted) {
    return user.wallet.tron.address;
  }

  const wallet = await generateTronWallet();
  const encryptedKey = encrypt(wallet.privateKey);

  if (!user.wallet) {
    user.wallet = {};
  }
  user.wallet.tron = {
    address: wallet.address,
    privateKeyEncrypted: encryptedKey,
    createdAt: new Date(),
  };
  await user.save();

  return wallet.address;
};

const findUserByDepositAddress = async (address) => {
  return User.findOne({ 'wallet.tron.address': address });
};

const getUserPrivateKey = (user) => {
  if (!user.wallet?.tron?.privateKeyEncrypted) {
    throw new Error('User TRON private key not found');
  }
  return decrypt(user.wallet.tron.privateKeyEncrypted);
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

  if (amount < MIN_DEPOSIT_USDT) {
    return { ignored: true, reason: 'Below minimum deposit' };
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
    user.wallet.depositStatus = 'pending';
    await user.save();

    const masterWallet = getMasterWallet();
    if (!masterWallet.address || !masterWallet.privateKey) {
      throw new Error('Master wallet not configured');
    }

    // Step 1: Fund user wallet with TRX for gas
    await sendTrx({
      fromPrivateKey: masterWallet.privateKey,
      to: address,
      amount: TRX_GAS_AMOUNT,
    });
    deposit.status = 'gas_funded';
    await deposit.save();

    // Step 2: Sweep USDT to master wallet
    const userPrivateKey = getUserPrivateKey(user);
    deposit.status = 'sweeping';
    await deposit.save();
    await sendUsdtTrc20({
      fromPrivateKey: userPrivateKey,
      to: masterWallet.address,
      amount,
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

    // Step 4: Update ledger and transaction
    await updateLedgerBalance({ user, amount });
    await addWalletTransaction({ user, amount, txHash });

    deposit.status = 'completed';
    await deposit.save();

    return { success: true };
  } catch (error) {
    deposit.status = 'failed';
    deposit.error = error.message;
    await deposit.save();
    user.wallet.depositStatus = 'failed';
    await user.save();
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
  const expectedChain = getTronChainName();
  const expectedToken = 'USDT';
  const expectedContract = getUsdtContract();

  const chainOk = chain && chain.toUpperCase().includes('TRON');
  const tokenOk = token && token.toUpperCase() === expectedToken;
  const contractOk = expectedContract
    ? (contractAddress || '').toLowerCase() === expectedContract.toLowerCase()
    : true;

  return chainOk && tokenOk && contractOk;
};

module.exports = {
  ensureUserTronWallet,
  processDeposit,
  normalizeWebhookPayload,
  isValidUsdtTrc20Deposit,
  getTatumMode,
};
