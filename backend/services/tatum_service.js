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
    const config = {
      method,
      url,
      data,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    };
    
    // Log request details for debugging (mask API key)
    console.log(`[TATUM API] ${method.toUpperCase()} ${url}`, {
      hasData: !!data,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
    });
    
    const response = await axios(config);
    return response;
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      console.error(`[TATUM API] ${method.toUpperCase()} ${path} failed:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      console.error(`[TATUM API] ${method.toUpperCase()} ${path} - No response:`, {
        message: error.message,
        url: error.config?.url,
      });
    } else {
      console.error(`[TATUM API] ${method.toUpperCase()} ${path} - Error:`, error.message);
    }
    throw error;
  }
};

const generateTronWallet = async () => {
  try {
    // Tatum v3 TRON wallet generation endpoint
    // GET /v3/tron/wallet - generates mnemonic and xpub
    const walletRes = await tatumRequest('get', '/tron/wallet');
    
    if (!walletRes || !walletRes.data) {
      throw new Error('Invalid response from Tatum API');
    }
    
    const { mnemonic, xpub } = walletRes.data;
    if (!mnemonic || !xpub) {
      throw new Error('Failed to generate TRON wallet - missing mnemonic or xpub');
    }

    // Use first index (0) for address and private key
    const index = 0;
    
    // GET /v3/tron/address/{xpub}/{index} - derive address from xpub
    const addressRes = await tatumRequest('get', `/tron/address/${xpub}/${index}`);
    
    const address = addressRes.data?.address;
    if (!address) {
      throw new Error('Failed to generate TRON address');
    }

    // POST /v3/tron/wallet/priv - derive private key from mnemonic
    const privRes = await tatumRequest('post', '/tron/wallet/priv', {
      index,
      mnemonic,
    });
    
    const privateKey = privRes.data?.key || privRes.data?.privateKey;
    if (!privateKey) {
      throw new Error('Failed to generate TRON private key');
    }

    return { address, privateKey };
  } catch (error) {
    // Enhanced error logging with full details
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
    const statusCode = error.response?.status;
    const errorData = error.response?.data;
    const requestUrl = error.config?.url;
    const requestMethod = error.config?.method?.toUpperCase();
    
    console.error(`[TATUM] Wallet generation failed:`, {
      message: errorMsg,
      status: statusCode,
      data: errorData,
      url: requestUrl,
      method: requestMethod,
      apiKey: getTatumApiKey() ? `${getTatumApiKey().substring(0, 10)}...` : 'MISSING',
    });
    
    // Provide more helpful error message
    if (statusCode === 404) {
      throw new Error(`Tatum API endpoint not found. Please verify your Tatum API key has TRON wallet generation permissions and the endpoint is correct: ${requestUrl}`);
    } else if (statusCode === 401 || statusCode === 403) {
      throw new Error(`Tatum API authentication failed. Please check your API key permissions for TRON operations.`);
    }
    
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
  const res = await tatumRequest('post', '/tron/transaction', body);
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
  const res = await tatumRequest('post', '/tron/trc20/transaction', body);
  return res.data;
};

const getTronAccount = async (address) => {
  const res = await tatumRequest('get', `/tron/account/${address}`);
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
