const axios = require('axios');

const TATUM_BASE_URL = process.env.TATUM_BASE_URL || 'https://api.tatum.io/v3';

const getTatumMode = () => (process.env.TATUM_MODE || 'test').toLowerCase();

const getEnvByMode = (baseName) => {
  const mode = getTatumMode();
  if (mode === 'production') {
    return process.env[`${baseName}_PROD`] || process.env[baseName];
  }
  return process.env[`${baseName}_TEST`] || process.env[baseName];
};

const getTatumApiKey = () => getEnvByMode('TATUM_API_KEY');

const getTronChainName = () => {
  const mode = getTatumMode();
  return mode === 'production'
    ? (process.env.TATUM_TRON_CHAIN_PROD || 'TRON')
    : (process.env.TATUM_TRON_CHAIN_TEST || 'TRON_TESTNET');
};

const getUsdtContract = () => getEnvByMode('TATUM_TRON_USDT_CONTRACT');

const getMasterWallet = () => ({
  address: getEnvByMode('TATUM_MASTER_ADDRESS'),
  privateKey: getEnvByMode('TATUM_MASTER_PRIVATE_KEY'),
});

const tatumRequest = async (method, path, data) => {
  const apiKey = getTatumApiKey();
  if (!apiKey) {
    throw new Error('TATUM_API_KEY is required');
  }
  const url = `${TATUM_BASE_URL}${path}`;
  
  try {
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });
    return response;
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      console.error(`[TATUM API] ${method.toUpperCase()} ${path} failed:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error(`[TATUM API] ${method.toUpperCase()} ${path} - No response:`, error.message);
    } else {
      console.error(`[TATUM API] ${method.toUpperCase()} ${path} - Error:`, error.message);
    }
    throw error;
  }
};

const generateTronWallet = async () => {
  try {
    // Try Tatum v3 TRON-specific endpoint first
    let walletRes;
    try {
      walletRes = await tatumRequest('post', '/tron/wallet');
    } catch (e) {
      // If that fails, try blockchain-agnostic endpoint
      const chain = getTronChainName();
      walletRes = await tatumRequest('post', `/blockchain/wallet/${chain}`);
    }
    
    if (!walletRes || !walletRes.data) {
      throw new Error('Invalid response from Tatum API');
    }
    
    const { mnemonic, xpub } = walletRes.data;
    if (!mnemonic || !xpub) {
      throw new Error('Failed to generate TRON wallet - missing mnemonic or xpub');
    }

    // Use first index for address and private key
    const index = 0;
    let addressRes;
    try {
      addressRes = await tatumRequest('get', `/tron/address/${xpub}/${index}`);
    } catch (e) {
      const chain = getTronChainName();
      addressRes = await tatumRequest('get', `/blockchain/address/${chain}/${xpub}/${index}`);
    }
    
    const address = addressRes.data?.address;
    if (!address) {
      throw new Error('Failed to generate TRON address');
    }

    let privRes;
    try {
      privRes = await tatumRequest('post', '/tron/wallet/priv', {
        index,
        mnemonic,
      });
    } catch (e) {
      privRes = await tatumRequest('post', '/blockchain/wallet/priv', {
        index,
        mnemonic,
      });
    }
    
    const privateKey = privRes.data?.key || privRes.data?.privateKey;
    if (!privateKey) {
      throw new Error('Failed to generate TRON private key');
    }

    return { address, privateKey };
  } catch (error) {
    // Better error logging
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
    const statusCode = error.response?.status;
    const errorData = error.response?.data;
    console.error(`[TATUM] Wallet generation failed:`, {
      message: errorMsg,
      status: statusCode,
      data: errorData,
      url: error.config?.url,
    });
    throw new Error(`Tatum wallet generation failed: ${errorMsg}`);
  }
};

const sendTrx = async ({ fromPrivateKey, to, amount }) => {
  if (!fromPrivateKey || !to || !amount) {
    throw new Error('Missing TRX transfer parameters');
  }
  const body = {
    fromPrivateKey,
    to,
    amount: amount.toString(),
  };
  let res;
  try {
    res = await tatumRequest('post', '/tron/transaction', body);
  } catch (e) {
    const chain = getTronChainName();
    res = await tatumRequest('post', `/blockchain/transaction/${chain}`, body);
  }
  return res.data;
};

const sendUsdtTrc20 = async ({ fromPrivateKey, to, amount }) => {
  if (!fromPrivateKey || !to || !amount) {
    throw new Error('Missing TRC20 transfer parameters');
  }
  const contractAddress = getUsdtContract();
  if (!contractAddress) {
    throw new Error('TATUM_TRON_USDT_CONTRACT is required');
  }
  const body = {
    fromPrivateKey,
    to,
    amount: amount.toString(),
    tokenAddress: contractAddress,
    feeLimit: 10000000, // default fee limit for TRC20
  };
  let res;
  try {
    res = await tatumRequest('post', '/tron/trc20/transaction', body);
  } catch (e) {
    const chain = getTronChainName();
    res = await tatumRequest('post', `/blockchain/token/transaction/${chain}`, body);
  }
  return res.data;
};

const getTronAccount = async (address) => {
  let res;
  try {
    res = await tatumRequest('get', `/tron/account/${address}`);
  } catch (e) {
    const chain = getTronChainName();
    res = await tatumRequest('get', `/blockchain/account/${chain}/${address}`);
  }
  return res.data;
};

module.exports = {
  getTatumMode,
  getTronChainName,
  getUsdtContract,
  getMasterWallet,
  generateTronWallet,
  sendTrx,
  sendUsdtTrc20,
  getTronAccount,
};
