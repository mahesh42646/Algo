const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../schemas/user');
const { encrypt, decrypt, maskSensitiveData } = require('../utils/encryption');

// Helper function to get Binance API URL based on test mode
function getBinanceApiUrl(isTest = false) {
  return isTest ? 'https://testnet.binance.vision/api/v3' : 'https://api.binance.com/api/v3';
}

// Get all exchange APIs for a user
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Return APIs with masked keys (never expose actual keys)
    const maskedApis = user.exchangeApis.map(api => ({
      _id: api._id,
      platform: api.platform,
      apiKey: maskSensitiveData(api.apiKey), // Mask encrypted key for display
      label: api.label,
      isTest: api.isTest,
      permissions: api.permissions,
      isActive: api.isActive,
      lastUsed: api.lastUsed,
      createdAt: api.createdAt,
    }));

    res.json({
      success: true,
      data: maskedApis,
    });
  } catch (error) {
    console.error(`[EXCHANGE API GET] ❌ Error:`, error.message);
    next(error);
  }
});

// Add new exchange API
router.post('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { platform, apiKey, apiSecret, label, permissions, isTest } = req.body;

    // Validate input
    if (!platform || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        error: 'Platform, API key, and API secret are required',
      });
    }

    // Validate platform
    const validPlatforms = ['binance', 'kucoin', 'bybit', 'okx', 'gate.io', 'huobi'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`,
      });
    }

    // Validate API key and secret format (basic validation)
    if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API key format',
      });
    }

    if (typeof apiSecret !== 'string' || apiSecret.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API secret format',
      });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if API for this platform already exists
    const existingApi = user.exchangeApis.find(
      api => api.platform === platform.toLowerCase() && api.isActive
    );

    if (existingApi) {
      return res.status(409).json({
        success: false,
        error: `Active API for ${platform} already exists. Please delete it first or update it.`,
      });
    }

    // Encrypt API credentials before storing (256-bit AES encryption)
    const encryptedKey = encrypt(apiKey.trim());
    const encryptedSecret = encrypt(apiSecret.trim());

    const newApi = {
      platform: platform.toLowerCase(),
      apiKey: encryptedKey,
      apiSecret: encryptedSecret,
      label: (label || 'Default').trim(),
      isTest: Boolean(isTest === true || isTest === 'true'),
      permissions: Array.isArray(permissions) ? permissions : ['read', 'spot_trade'],
      isActive: true,
      createdAt: new Date(),
    };

    user.exchangeApis.push(newApi);

    // Add notification
    user.notifications.push({
      title: 'API Key Added 🔑',
      message: `Your ${platform.toUpperCase()} API has been successfully linked.`,
      type: 'success',
      read: false,
      createdAt: new Date(),
    });

    await user.save();

    const savedApi = user.exchangeApis[user.exchangeApis.length - 1];

    // Never return actual credentials, only masked version
    res.status(201).json({
      success: true,
      message: 'Exchange API added successfully',
      data: {
        _id: savedApi._id,
        platform: savedApi.platform,
        apiKey: maskSensitiveData(apiKey), // Mask original key for response
        label: savedApi.label,
        isTest: savedApi.isTest,
        permissions: savedApi.permissions,
        isActive: savedApi.isActive,
        createdAt: savedApi.createdAt,
      },
    });
  } catch (error) {
    // Don't expose encryption errors
    if (error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE API ADD] ❌ Encryption configuration error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE API ADD] ❌ Error:`, error.message);
    next(error);
  }
});

// Update exchange API
router.put('/:userId/:apiId', async (req, res, next) => {
  try {
    const { userId, apiId } = req.params;
    const { apiKey, apiSecret, label, permissions, isActive } = req.body;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.id(apiId);

    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found',
      });
    }

    // Update fields with validation
    if (apiKey !== undefined) {
      if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API key format',
        });
      }
      api.apiKey = encrypt(apiKey.trim());
    }
    
    if (apiSecret !== undefined) {
      if (typeof apiSecret !== 'string' || apiSecret.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API secret format',
        });
      }
      api.apiSecret = encrypt(apiSecret.trim());
    }
    
    if (label !== undefined) {
      api.label = typeof label === 'string' ? label.trim() : label;
    }
    
    if (permissions !== undefined) {
      api.permissions = Array.isArray(permissions) ? permissions : api.permissions;
    }
    
    if (isActive !== undefined) {
      api.isActive = Boolean(isActive);
    }

    await user.save();

    // Never return actual credentials
    res.json({
      success: true,
      message: 'Exchange API updated successfully',
      data: {
        _id: api._id,
        platform: api.platform,
        apiKey: maskSensitiveData(apiKey || 'existing'),
        label: api.label,
        permissions: api.permissions,
        isActive: api.isActive,
        createdAt: api.createdAt,
      },
    });
  } catch (error) {
    if (error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE API UPDATE] ❌ Encryption configuration error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE API UPDATE] ❌ Error:`, error.message);
    next(error);
  }
});

// Delete exchange API
router.delete('/:userId/:apiId', async (req, res, next) => {
  try {
    const { userId, apiId } = req.params;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.id(apiId);

    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found',
      });
    }

    const platform = api.platform;
    user.exchangeApis.pull(apiId);

    // Add notification
    user.notifications.push({
      title: 'API Key Removed',
      message: `Your ${platform.toUpperCase()} API has been unlinked.`,
      type: 'info',
      read: false,
      createdAt: new Date(),
    });

    await user.save();

    res.json({
      success: true,
      message: 'Exchange API deleted successfully',
    });
  } catch (error) {
    console.error(`[EXCHANGE API DELETE] ❌ Error:`, error.message);
    next(error);
  }
});

// Get decrypted API credentials (internal use for trading)
// WARNING: This endpoint returns sensitive data - ensure it's only called internally
// and never logged or exposed
router.get('/:userId/:platform/credentials', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform.toLowerCase() && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    // Update last used timestamp
    api.lastUsed = new Date();
    await user.save();

    // Decrypt and return credentials
    // NOTE: This data will be sanitized by logger middleware before logging
    const credentials = {
      apiKey: decrypt(api.apiKey),
      apiSecret: decrypt(api.apiSecret),
      permissions: api.permissions,
    };

    res.json({
      success: true,
      data: credentials,
    });
  } catch (error) {
    // Never expose decryption errors with details
    if (error.message.includes('Decryption failed') || error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE API CREDENTIALS] ❌ Security error`);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve credentials. Please contact support.',
      });
    }
    console.error(`[EXCHANGE API CREDENTIALS] ❌ Error:`, error.message);
    next(error);
  }
});

// Verify API connection with exchange
router.post('/:userId/:platform/verify', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get API ID from query or body
    const apiId = req.query.apiId || req.body.apiId;
    
    let api;
    if (apiId) {
      api = user.exchangeApis.id(apiId);
    } else {
      api = user.exchangeApis.find(
        a => a.platform === platform.toLowerCase() && a.isActive
      );
    }

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    // Decrypt credentials (will be sanitized in logs)
    let apiKey, apiSecret;
    try {
      apiKey = decrypt(api.apiKey);
      apiSecret = decrypt(api.apiSecret);
      console.log(`[EXCHANGE API VERIFY] ✅ Credentials decrypted successfully`);
      console.log(`[EXCHANGE API VERIFY] 📝 API Key (masked): ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
      console.log(`[EXCHANGE API VERIFY] 🧪 Test Mode: ${api.isTest ? 'YES' : 'NO'}`);
    } catch (decryptError) {
      console.error(`[EXCHANGE API VERIFY] ❌ Decryption failed:`, decryptError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to decrypt API credentials. Please re-add your API key and secret.',
        details: 'Encryption key mismatch or corrupted data',
      });
    }

    // Verify with Binance API
    if (platform.toLowerCase() === 'binance') {
      const axios = require('axios');
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      
      // Validate API key and secret format
      if (!apiKey || apiKey.length < 20) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API Key',
          details: 'API key appears to be invalid or corrupted',
        });
      }
      
      if (!apiSecret || apiSecret.length < 20) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API Secret',
          details: 'API secret appears to be invalid or corrupted',
        });
      }
      
      // Get server's public IP address for whitelisting (do this first)
      let serverPublicIP = 'Unknown';
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
        serverPublicIP = ipResponse.data.ip;
        console.log(`[EXCHANGE API VERIFY] 📍 Server public IP: ${serverPublicIP}`);
      } catch (ipError) {
        console.warn(`[EXCHANGE API VERIFY] ⚠️ Could not fetch public IP:`, ipError.message);
        // Try alternative method
        try {
          const altResponse = await axios.get('https://ifconfig.me/ip', { timeout: 5000 });
          serverPublicIP = altResponse.data.trim();
          console.log(`[EXCHANGE API VERIFY] 📍 Server public IP (alt): ${serverPublicIP}`);
        } catch (altError) {
          console.warn(`[EXCHANGE API VERIFY] ⚠️ Alternative IP fetch failed`);
        }
      }

      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');
      
      console.log(`[EXCHANGE API VERIFY] 🔐 Signature generated (length: ${signature.length})`);
      console.log(`[EXCHANGE API VERIFY] 📡 Making request to Binance API...`);
      console.log(`[EXCHANGE API VERIFY] 🔑 API Key (first 8 chars): ${apiKey.substring(0, 8)}...`);
      console.log(`[EXCHANGE API VERIFY] 🌐 Request will come from IP: ${serverPublicIP}`);

      try {
        const binanceBaseUrl = getBinanceApiUrl(api.isTest);
        const binanceUrl = `${binanceBaseUrl}/account?${queryString}&signature=${signature}`;
        console.log(`[EXCHANGE API VERIFY] 📤 Request URL: ${binanceBaseUrl}/account?timestamp=${timestamp}&signature=[REDACTED]`);
        
        const response = await axios.get(binanceUrl, {
          headers: {
            'X-MBX-APIKEY': apiKey,
          },
          timeout: 10000,
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        });
        
        // Check if response indicates an error
        if (response.status !== 200 || response.data.code) {
          throw {
            response: {
              status: response.status,
              data: response.data,
            },
          };
        }

        // Update last used
        api.lastUsed = new Date();
        await user.save();

        console.log(`[EXCHANGE API VERIFY] ✅ Binance API verified successfully for user ${userId}`);

        res.json({
          success: true,
          message: 'API connection verified successfully',
          data: {
            canTrade: response.data.canTrade,
            canWithdraw: response.data.canWithdraw,
            canDeposit: response.data.canDeposit,
            balances: response.data.balances
              .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
              .slice(0, 10), // Return top 10 non-zero balances
          },
        });
      } catch (apiError) {
        // Extract detailed error information
        const binanceError = apiError.response?.data?.msg || apiError.message || 'API verification failed';
        const errorCode = apiError.response?.data?.code;
        const statusCode = apiError.response?.status || apiError.response?.statusCode;
        
        console.error(`[EXCHANGE API VERIFY] ❌ Binance API error:`);
        console.error(`   Error Code: ${errorCode || 'N/A'}`);
        console.error(`   Status Code: ${statusCode || 'N/A'}`);
        console.error(`   Error Message: ${binanceError}`);
        console.error(`   Server Public IP: ${serverPublicIP}`);
        console.error(`   API Key (first 8): ${apiKey.substring(0, 8)}...`);
        console.error(`   ⚠️ If IP restriction error, add this IP to Binance whitelist: ${serverPublicIP}`);
        console.error(`   ⚠️ If you already added the IP, wait 2-5 minutes for Binance to update`);
        
        // Additional diagnostics for -2015
        if (errorCode === -2015) {
          console.error(`   🔍 Error -2015 Diagnostics:`);
          console.error(`      - This error can mean: Invalid API key, IP restriction, or permissions`);
          console.error(`      - Server IP detected: ${serverPublicIP}`);
          console.error(`      - API Key length: ${apiKey.length} characters (expected: 64+)`);
          console.error(`      - API Secret length: ${apiSecret.length} characters (expected: 64+)`);
          console.error(`      - API Key starts with: ${apiKey.substring(0, 8)}...`);
          console.error(`      - Check if IP ${serverPublicIP} is in Binance whitelist`);
          console.error(`      - ⏰ IMPORTANT: Wait 2-5 minutes after adding IP before retrying`);
          console.error(`      - Verify API key and secret are correct in Binance`);
          console.error(`      - Check that "Enable Reading" permission is enabled`);
          
          // Validate credentials format
          if (apiKey.length < 50 || apiSecret.length < 50) {
            console.error(`      ⚠️ WARNING: API credentials seem too short - may be corrupted`);
          }
        }

        // Build detailed error response
        let errorMessage = 'API verification failed';
        let errorDetails = binanceError;
        let troubleshooting = [];

        // Parse specific Binance errors
        if (binanceError.includes('Invalid signature')) {
          errorMessage = 'Invalid API Secret';
          errorDetails = 'The API secret key does not match the API key. Please check your API secret.';
          troubleshooting = [
            'Verify that your API secret is correct',
            'Make sure you copied the complete secret key',
            'Check for any extra spaces or characters'
          ];
        } else if (binanceError.includes('Invalid API-key') || binanceError.includes('Invalid API key')) {
          errorMessage = 'Invalid API Key';
          errorDetails = 'The API key is incorrect or does not exist.';
          troubleshooting = [
            'Verify that your API key is correct',
            'Check if the API key is active in Binance',
            'Make sure you copied the complete key'
          ];
        } else if (errorCode === -2015) {
          // Error -2015 can mean: Invalid API-key, IP restriction, or permissions
          // Check if IP restriction is likely the issue
          if (binanceError.includes('IP') || binanceError.toLowerCase().includes('ip')) {
          errorMessage = 'IP Address Restriction';
          errorDetails = `Your API key has IP restrictions enabled. The server IP must be whitelisted in Binance.`;
          troubleshooting = [
            `✅ IP to whitelist: ${serverPublicIP}`,
            'Go to Binance → API Management → Edit API → IP Access Restriction',
            'Make sure "Restrict access to trusted IPs only" is selected',
            `Add this exact IP: ${serverPublicIP}`,
            '',
            '⚠️ IMPORTANT: IP Propagation Delay',
            'After adding the IP to Binance whitelist, you MUST wait:',
            '  • Minimum: 2-3 minutes',
            '  • Recommended: 5 minutes',
            '  • Maximum: Up to 10 minutes',
            '',
            'Binance needs time to propagate the IP whitelist change across their servers.',
            'If you just added the IP, please wait and try again in a few minutes.',
            '',
            '💡 Tip: Check Binance API Management page to confirm the IP is saved correctly.',
          ];
          } else {
            // Could be API key or permissions issue
            errorMessage = 'API Authentication Failed';
            errorDetails = `Binance returned error -2015. This can mean: Invalid API key, IP restriction, or insufficient permissions.`;
            troubleshooting = [
              '1. Verify API Key:',
              '   - Check that your API key is correct in Binance',
              '   - Make sure the API key is active and not deleted',
              '',
              '2. Check IP Restrictions:',
              `   - Add this IP to Binance whitelist: ${serverPublicIP}`,
              '   - Wait 2-5 minutes after adding IP',
              '',
              '3. Verify Permissions:',
              '   - Enable "Enable Reading" permission',
              '   - Enable "Enable Spot & Margin Trading" (if needed)',
              '',
              '4. Check API Secret:',
              '   - Verify your API secret is correct',
              '   - Make sure there are no extra spaces',
            ];
          }
        } else if (binanceError.includes('IP') || binanceError.includes('restriction')) {
          errorMessage = 'IP Address Restriction';
          errorDetails = `Your API key has IP restrictions enabled. Binance requires the server IP to be whitelisted.`;
          troubleshooting = [
            `Add this IP address to your Binance API whitelist: ${serverPublicIP}`,
            'Go to Binance → API Management → Edit API → IP Access Restriction',
            'Add the IP address shown above',
            'Save and wait 2-5 minutes for changes to take effect',
            'Then try verifying again'
          ];
        } else if (binanceError.includes('Permission') || errorCode === -2010) {
          errorMessage = 'Insufficient Permissions';
          errorDetails = 'Your API key does not have the required permissions.';
          troubleshooting = [
            'Enable "Enable Reading" permission',
            'Enable "Enable Spot & Margin Trading" permission (if you want to trade)',
            'Go to Binance → API Management → Edit API → Permissions',
            'Save and try again'
          ];
        } else if (binanceError.includes('expired') || binanceError.includes('Expired')) {
          errorMessage = 'API Key Expired';
          errorDetails = 'Your API key has expired or been revoked.';
          troubleshooting = [
            'Check if the API key is still active in Binance',
            'Create a new API key if needed',
            'Update the API credentials in the app'
          ];
        }

        return res.status(400).json({
          success: false,
          error: errorMessage,
          details: errorDetails,
          serverIP: serverPublicIP,
          troubleshooting: troubleshooting,
          binanceErrorCode: errorCode,
          rawError: binanceError,
        });
      }
    } else {
      // For other platforms, just return success for now
      res.json({
        success: true,
        message: 'API stored successfully. Verification for this platform coming soon.',
      });
    }
  } catch (error) {
    if (error.message.includes('Decryption failed') || error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE API VERIFY] ❌ Security error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE API VERIFY] ❌ Error:`, error.message);
    next(error);
  }
});

// Get account balance from exchange
router.get('/:userId/:platform/balance', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform.toLowerCase() && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    // Decrypt credentials (will be sanitized in logs)
    let apiKey, apiSecret;
    try {
      apiKey = decrypt(api.apiKey);
      apiSecret = decrypt(api.apiSecret);
      console.log(`[EXCHANGE BALANCE] ✅ Credentials decrypted successfully`);
    } catch (decryptError) {
      console.error(`[EXCHANGE BALANCE] ❌ Decryption failed:`, decryptError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to decrypt API credentials. Please re-add your API key and secret.',
        details: 'Encryption key mismatch or corrupted data',
      });
    }

    if (platform.toLowerCase() === 'binance') {
      const axios = require('axios');
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      
      // Validate API key and secret format
      if (!apiKey || apiKey.length < 20) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API Key',
          details: 'API key appears to be invalid or corrupted',
        });
      }
      
      if (!apiSecret || apiSecret.length < 20) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API Secret',
          details: 'API secret appears to be invalid or corrupted',
        });
      }

      // Get server's public IP address for whitelisting (do this first)
      let serverPublicIP = 'Unknown';
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
        serverPublicIP = ipResponse.data.ip;
        console.log(`[EXCHANGE BALANCE] 📍 Server public IP: ${serverPublicIP}`);
      } catch (ipError) {
        console.warn(`[EXCHANGE BALANCE] ⚠️ Could not fetch public IP:`, ipError.message);
        try {
          const altResponse = await axios.get('https://ifconfig.me/ip', { timeout: 5000 });
          serverPublicIP = altResponse.data.trim();
          console.log(`[EXCHANGE BALANCE] 📍 Server public IP (alt): ${serverPublicIP}`);
        } catch (altError) {
          console.warn(`[EXCHANGE BALANCE] ⚠️ Alternative IP fetch failed`);
        }
      }
      
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');
      
      console.log(`[EXCHANGE BALANCE] 🔐 Signature generated (length: ${signature.length})`);
      console.log(`[EXCHANGE BALANCE] 📡 Making request to Binance API...`);
      console.log(`[EXCHANGE BALANCE] 🔑 API Key (first 8 chars): ${apiKey.substring(0, 8)}...`);
      console.log(`[EXCHANGE BALANCE] 🌐 Request will come from IP: ${serverPublicIP}`);

      try {
        const binanceBaseUrl = getBinanceApiUrl(api.isTest);
        const binanceUrl = `${binanceBaseUrl}/account?${queryString}&signature=${signature}`;
        console.log(`[EXCHANGE BALANCE] 📤 Request URL: ${binanceBaseUrl}/account?timestamp=${timestamp}&signature=[REDACTED]`);
        console.log(`[EXCHANGE BALANCE] 🧪 Test Mode: ${api.isTest ? 'YES' : 'NO'}`);
        
        const response = await axios.get(binanceUrl, {
          headers: {
            'X-MBX-APIKEY': apiKey,
          },
          timeout: 10000,
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        });
        
        // Check if response indicates an error
        if (response.status !== 200 || response.data.code) {
          throw {
            response: {
              status: response.status,
              data: response.data,
            },
          };
        }

        const balances = response.data.balances
          .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
          .map(b => ({
            asset: b.asset,
            free: parseFloat(b.free),
            locked: parseFloat(b.locked),
            total: parseFloat(b.free) + parseFloat(b.locked),
          }));

        console.log(`[EXCHANGE BALANCE] ✅ Retrieved ${balances.length} balances for user ${userId}`);

        res.json({
          success: true,
          data: {
            balances,
            canTrade: response.data.canTrade,
            canWithdraw: response.data.canWithdraw,
          },
        });
      } catch (apiError) {
        const binanceError = apiError.response?.data?.msg || apiError.message || 'Failed to get balance';
        const errorCode = apiError.response?.data?.code;
        
        console.error(`[EXCHANGE BALANCE] ❌ Binance API error:`);
        console.error(`   Error Code: ${errorCode || 'N/A'}`);
        console.error(`   Error Message: ${binanceError}`);
        console.error(`   Server Public IP: ${serverPublicIP}`);
        console.error(`   API Key (first 8): ${apiKey.substring(0, 8)}...`);
        console.error(`   ⚠️ If IP restriction error, add this IP to Binance whitelist: ${serverPublicIP}`);
        console.error(`   ⚠️ If you already added the IP, wait 2-5 minutes for Binance to update`);
        
        // Additional diagnostics for -2015
        if (errorCode === -2015) {
          console.error(`   🔍 Error -2015 Diagnostics:`);
          console.error(`      - This error can mean: Invalid API key, IP restriction, or permissions`);
          console.error(`      - Server IP detected: ${serverPublicIP}`);
          console.error(`      - API Key length: ${apiKey.length} characters (expected: 64+)`);
          console.error(`      - API Secret length: ${apiSecret.length} characters (expected: 64+)`);
          console.error(`      - API Key starts with: ${apiKey.substring(0, 8)}...`);
          console.error(`      - Check if IP ${serverPublicIP} is in Binance whitelist`);
          console.error(`      - ⏰ IMPORTANT: Wait 2-5 minutes after adding IP before retrying`);
          console.error(`      - Verify API key and secret are correct in Binance`);
          console.error(`      - Check that "Enable Reading" permission is enabled`);
          
          // Validate credentials format
          if (apiKey.length < 50 || apiSecret.length < 50) {
            console.error(`      ⚠️ WARNING: API credentials seem too short - may be corrupted`);
          }
        }

        let errorMessage = 'Failed to get balance from Binance';
        let errorDetails = binanceError;
        let troubleshooting = [];

        if (errorCode === -2015) {
          // Error -2015 can mean: Invalid API-key, IP restriction, or permissions
          if (binanceError.includes('IP') || binanceError.toLowerCase().includes('ip')) {
            errorMessage = 'IP Address Restriction';
            errorDetails = `Your API key has IP restrictions. The server IP must be whitelisted.`;
            troubleshooting = [
              `✅ IP to whitelist: ${serverPublicIP}`,
              'Go to Binance → API Management → Edit API → IP Access Restriction',
              `Add this exact IP: ${serverPublicIP}`,
              '',
              '⚠️ IMPORTANT: IP Propagation Delay',
              'After adding the IP to Binance whitelist, you MUST wait:',
              '  • Minimum: 2-3 minutes',
              '  • Recommended: 5 minutes',
              '  • Maximum: Up to 10 minutes',
              '',
              'Binance needs time to propagate the IP whitelist change across their servers.',
              'If you just added the IP, please wait and try again in a few minutes.',
              '',
              '💡 Tip: Check Binance API Management page to confirm the IP is saved correctly.',
            ];
          } else {
            errorMessage = 'API Authentication Failed';
            errorDetails = `Binance returned error -2015. This can mean: Invalid API key, IP restriction, or insufficient permissions.`;
            troubleshooting = [
              '1. Verify API Key and Secret are correct',
              '2. Check IP Restrictions:',
              `   - Add this IP to Binance whitelist: ${serverPublicIP}`,
              '   - Wait 2-5 minutes after adding IP',
              '3. Verify Permissions:',
              '   - Enable "Enable Reading" permission',
            ];
          }
        } else if (binanceError.includes('IP') || binanceError.includes('restriction')) {
          errorMessage = 'IP Address Restriction';
          errorDetails = `Your API key has IP restrictions. Add this IP to Binance whitelist: ${serverPublicIP}`;
          troubleshooting = [
            `Add this IP to Binance API whitelist: ${serverPublicIP}`,
            'Go to Binance → API Management → Edit API → IP Access Restriction',
            'Save and wait 2-5 minutes, then try again'
          ];
        } else if (binanceError.includes('Invalid signature')) {
          errorMessage = 'Invalid API Secret';
          errorDetails = 'The API secret does not match the API key.';
          troubleshooting = [
            'Verify that your API secret is correct',
            'Make sure you copied the complete secret key',
            'Check for any extra spaces or characters',
            'Try re-adding the API credentials',
          ];
        } else if (binanceError.includes('Invalid API-key') || binanceError.includes('Invalid API key')) {
          errorMessage = 'Invalid API Key';
          errorDetails = 'The API key is incorrect or does not exist.';
          troubleshooting = [
            'Verify that your API key is correct',
            'Check if the API key is active in Binance',
            'Make sure you copied the complete key',
            'Try creating a new API key if needed',
          ];
        }

        return res.status(400).json({
          success: false,
          error: errorMessage,
          details: errorDetails,
          serverIP: serverPublicIP,
          troubleshooting: troubleshooting,
          binanceErrorCode: errorCode,
          rawError: binanceError,
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: `Balance retrieval for ${platform} not implemented yet`,
      });
    }
  } catch (error) {
    if (error.message.includes('Decryption failed') || error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE BALANCE] ❌ Security error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE BALANCE] ❌ Error:`, error.message);
    next(error);
  }
});

// Place order on exchange
router.post('/:userId/:platform/order', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;
    const { symbol, side, type, quantity, price } = req.body;

    // Validate required fields
    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, side, type, and quantity are required',
      });
    }

    // Validate side
    if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Side must be BUY or SELL',
      });
    }

    // Validate type
    if (!['MARKET', 'LIMIT'].includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Type must be MARKET or LIMIT',
      });
    }

    // Validate quantity
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a positive number',
      });
    }

    // Validate price for LIMIT orders
    if (type.toUpperCase() === 'LIMIT' && (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Price is required for LIMIT orders and must be a positive number',
      });
    }

    const user = await User.findOne({ userId }).select('exchangeApis notifications');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform.toLowerCase() && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    // Check permissions
    if (!api.permissions.includes('spot_trade')) {
      return res.status(403).json({
        success: false,
        error: 'API does not have trading permission',
      });
    }

    // Decrypt credentials (will be sanitized in logs)
    const apiKey = decrypt(api.apiKey);
    const apiSecret = decrypt(api.apiSecret);

    if (platform.toLowerCase() === 'binance') {
      const axios = require('axios');
      const timestamp = Date.now();
      
      let queryString = `symbol=${symbol.toUpperCase()}&side=${side.toUpperCase()}&type=${type.toUpperCase()}&quantity=${qty}&timestamp=${timestamp}`;
      
      if (type.toUpperCase() === 'LIMIT' && price) {
        queryString += `&price=${parseFloat(price)}&timeInForce=GTC`;
      }
      
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');

      try {
        const response = await axios.post(
          `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`,
          null,
          {
            headers: {
              'X-MBX-APIKEY': apiKey,
            },
            timeout: 10000,
          }
        );

        // Add notification
        user.notifications.push({
          title: `Order ${side.toUpperCase()} Executed 📈`,
          message: `${side.toUpperCase()} ${qty} ${symbol.toUpperCase()} - Order ID: ${response.data.orderId}`,
          type: 'success',
          read: false,
          createdAt: new Date(),
        });
        await user.save();

        res.json({
          success: true,
          message: 'Order placed successfully',
          data: {
            orderId: response.data.orderId,
            symbol: response.data.symbol,
            side: response.data.side,
            type: response.data.type,
            quantity: response.data.origQty,
            price: response.data.price,
            status: response.data.status,
            executedQty: response.data.executedQty,
          },
        });
      } catch (apiError) {
        const errorMessage = apiError.response?.data?.msg || 'Failed to place order';
        console.error(`[EXCHANGE ORDER] ❌ Binance API error:`, errorMessage);
        return res.status(400).json({
          success: false,
          error: 'Failed to place order on Binance',
          details: errorMessage,
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: `Trading on ${platform} not implemented yet`,
      });
    }
  } catch (error) {
    if (error.message.includes('Decryption failed') || error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE ORDER] ❌ Security error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE ORDER] ❌ Error:`, error.message);
    next(error);
  }
});

module.exports = router;
