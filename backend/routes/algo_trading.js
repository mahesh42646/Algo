const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const { decrypt } = require('../utils/encryption');
const crypto = require('crypto');
const axios = require('axios');

// Store active algo trades in memory (in production, use Redis or database)
const activeTrades = new Map();

// Start algo trading
router.post('/:userId/start', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { symbol, maxLossPerTrade, maxLossOverall, maxProfitBook, amountPerLevel, numberOfLevels } = req.body;

    // Validate input
    if (!symbol || !maxLossPerTrade || !maxLossOverall || !maxProfitBook || !amountPerLevel || !numberOfLevels) {
      return res.status(400).json({
        success: false,
        error: 'All parameters are required',
      });
    }

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if there's an active trade for this symbol
    const tradeKey = `${userId}:${symbol}`;
    if (activeTrades.has(tradeKey)) {
      // Stop existing trade
      const existingTrade = activeTrades.get(tradeKey);
      if (existingTrade.intervalId) {
        clearInterval(existingTrade.intervalId);
      }
    }

    // Get Binance API
    const api = user.exchangeApis.find(
      a => a.platform === 'binance' && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'No active Binance API found. Please link your API first.',
      });
    }

    // Decrypt credentials
    let apiKey, apiSecret;
    try {
      apiKey = decrypt(api.apiKey);
      apiSecret = decrypt(api.apiSecret);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to decrypt API credentials',
      });
    }

    // Create trade object
    const trade = {
      userId,
      symbol: symbol.toUpperCase(),
      maxLossPerTrade: parseFloat(maxLossPerTrade),
      maxLossOverall: parseFloat(maxLossOverall),
      maxProfitBook: parseFloat(maxProfitBook),
      amountPerLevel: parseFloat(amountPerLevel),
      numberOfLevels: parseInt(numberOfLevels),
      apiKey,
      apiSecret,
      startPrice: 0,
      currentLevel: 0,
      totalInvested: 0,
      orders: [],
      isActive: true,
      startedAt: new Date(),
      lastSignal: null,
      intervalId: null,
    };

    // Start the algo trading loop
    const intervalId = setInterval(async () => {
      try {
        await executeAlgoTradingStep(trade);
      } catch (error) {
        console.error(`[ALGO TRADING] Error in trading step for ${symbol}:`, error.message);
      }
    }, 30000); // Check every 30 seconds

    trade.intervalId = intervalId;
    activeTrades.set(tradeKey, trade);

    console.log(`[ALGO TRADING] ✅ Started algo trading for ${symbol} (User: ${userId})`);

    res.json({
      success: true,
      message: 'Algo trading started successfully',
      data: {
        symbol: trade.symbol,
        startedAt: trade.startedAt,
      },
    });
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error starting algo trade:`, error);
    next(error);
  }
});

// Stop algo trading
router.post('/:userId/stop', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required',
      });
    }

    const tradeKey = `${userId}:${symbol.toUpperCase()}`;
    const trade = activeTrades.get(tradeKey);

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'No active trade found for this symbol',
      });
    }

    // Stop the interval
    if (trade.intervalId) {
      clearInterval(trade.intervalId);
    }

    // Mark as inactive
    trade.isActive = false;
    trade.stoppedAt = new Date();

    activeTrades.delete(tradeKey);

    console.log(`[ALGO TRADING] ⏹️ Stopped algo trading for ${symbol} (User: ${userId})`);

    res.json({
      success: true,
      message: 'Algo trading stopped successfully',
    });
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error stopping algo trade:`, error);
    next(error);
  }
});

// Get trade status
router.get('/:userId/status', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required',
      });
    }

    const tradeKey = `${userId}:${symbol.toUpperCase()}`;
    const trade = activeTrades.get(tradeKey);

    if (!trade || !trade.isActive) {
      return res.json({
        success: true,
        data: {
          isActive: false,
        },
      });
    }

    // Return trade status without sensitive data
    res.json({
      success: true,
      data: {
        isActive: true,
        symbol: trade.symbol,
        currentLevel: trade.currentLevel,
        totalInvested: trade.totalInvested,
        numberOfLevels: trade.numberOfLevels,
        startedAt: trade.startedAt,
        lastSignal: trade.lastSignal,
      },
    });
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error getting trade status:`, error);
    next(error);
  }
});

// Get all active trades
router.get('/:userId/trades', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userTrades = [];
    for (const [key, trade] of activeTrades.entries()) {
      if (trade.userId === userId && trade.isActive) {
        userTrades.push({
          symbol: trade.symbol,
          currentLevel: trade.currentLevel,
          totalInvested: trade.totalInvested,
          numberOfLevels: trade.numberOfLevels,
          startedAt: trade.startedAt,
          lastSignal: trade.lastSignal,
        });
      }
    }

    res.json({
      success: true,
      data: userTrades,
    });
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error getting active trades:`, error);
    next(error);
  }
});

// Execute one step of algo trading
async function executeAlgoTradingStep(trade) {
  try {
    // Get current price and technical indicators
    const currentPrice = await getCurrentPrice(trade.symbol);
    
    if (trade.startPrice === 0) {
      trade.startPrice = currentPrice;
    }

    // Get technical indicators
    const candles = await getCandlesticks(trade.symbol, '5m', 200);
    const signal = await getTradingSignal(candles, currentPrice);

    trade.lastSignal = signal;

    // If no strong signal, skip this cycle
    if (signal.strength !== 'strong') {
      console.log(`[ALGO TRADING] ${trade.symbol}: ${signal.direction} signal (${signal.strength}) - Skipping`);
      return;
    }

    // Calculate current P&L
    const currentPnL = ((currentPrice - trade.startPrice) / trade.startPrice) * 100;
    const avgPrice = trade.totalInvested > 0 
      ? trade.totalInvested / (trade.orders.reduce((sum, o) => sum + parseFloat(o.quantity), 0) || 1)
      : currentPrice;

    // Check stop conditions
    if (currentPnL >= trade.maxProfitBook) {
      // Book profit
      await closeAllPositions(trade, 'profit');
      return;
    }

    if (trade.currentLevel >= trade.numberOfLevels) {
      // Max levels reached, check overall loss
      const overallLoss = ((avgPrice - trade.startPrice) / trade.startPrice) * 100;
      if (overallLoss <= -trade.maxLossOverall) {
        await closeAllPositions(trade, 'max_loss');
        return;
      }
    }

    // Check if we need to add more (averaging down)
    if (signal.direction === 'BUY' && currentPnL <= -trade.maxLossPerTrade && trade.currentLevel < trade.numberOfLevels) {
      // Place buy order
      await placeOrder(trade, 'BUY', currentPrice, trade.amountPerLevel);
      trade.currentLevel++;
    } else if (signal.direction === 'SELL' && currentPnL >= trade.maxProfitBook) {
      // Place sell order to book profit
      await closeAllPositions(trade, 'profit');
    }

  } catch (error) {
    console.error(`[ALGO TRADING] Error in trading step:`, error.message);
  }
}

// Get current price
async function getCurrentPrice(symbol) {
  try {
    const response = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      { timeout: 5000 }
    );
    return parseFloat(response.data.price);
  } catch (error) {
    throw new Error(`Failed to get current price: ${error.message}`);
  }
}

// Get candlesticks
async function getCandlesticks(symbol, interval, limit) {
  try {
    const response = await axios.get(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get candlesticks: ${error.message}`);
  }
}

// Get trading signal from technical indicators
async function getTradingSignal(candles, currentPrice) {
  try {
    const closes = candles.map(c => parseFloat(c[4])); // Close prices
    
    // Calculate MAs
    const ma20 = calculateSMA(closes, 20);
    const ma50 = calculateSMA(closes, 50);
    const ma200 = calculateSMA(closes, 200);
    
    if (ma20.length === 0 || ma50.length === 0 || ma200.length === 0) {
      return { direction: 'NEUTRAL', strength: 'weak' };
    }

    const ma20Value = ma20[ma20.length - 1];
    const ma50Value = ma50[ma50.length - 1];
    const ma200Value = ma200[ma200.length - 1];

    // Calculate MACD
    const macd = calculateMACD(closes);
    const macdLine = macd.macd[macd.macd.length - 1];
    const signalLine = macd.signal[macd.signal.length - 1];

    // Determine signal strength
    let buySignals = 0;
    let sellSignals = 0;

    // MA signals
    if (currentPrice > ma20Value && ma20Value > ma50Value && ma50Value > ma200Value) {
      buySignals += 2; // Strong buy
    } else if (currentPrice < ma20Value && ma20Value < ma50Value && ma50Value < ma200Value) {
      sellSignals += 2; // Strong sell
    }

    if (currentPrice > ma20Value) buySignals++;
    else if (currentPrice < ma20Value) sellSignals++;

    // MACD signals
    if (macdLine > signalLine && macdLine > 0) {
      buySignals++;
    } else if (macdLine < signalLine && macdLine < 0) {
      sellSignals++;
    }

    // Determine direction and strength
    if (buySignals >= 3) {
      return { direction: 'BUY', strength: 'strong' };
    } else if (sellSignals >= 3) {
      return { direction: 'SELL', strength: 'strong' };
    } else if (buySignals > sellSignals) {
      return { direction: 'BUY', strength: 'weak' };
    } else if (sellSignals > buySignals) {
      return { direction: 'SELL', strength: 'weak' };
    }

    return { direction: 'NEUTRAL', strength: 'weak' };
  } catch (error) {
    console.error(`[ALGO TRADING] Error calculating signal:`, error.message);
    return { direction: 'NEUTRAL', strength: 'weak' };
  }
}

// Place order
async function placeOrder(trade, side, price, amount) {
  try {
    const timestamp = Date.now();
    const quantity = (amount / price).toFixed(8);
    
    // For limit orders, place slightly below market for buy, above for sell
    const limitPrice = side === 'BUY' 
      ? (price * 0.998).toFixed(8) // 0.2% below
      : (price * 1.002).toFixed(8); // 0.2% above

    const queryString = `symbol=${trade.symbol}&side=${side}&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${limitPrice}&timestamp=${timestamp}`;
    
    const signature = crypto
      .createHmac('sha256', trade.apiSecret)
      .update(queryString)
      .digest('hex');

    const response = await axios.post(
      `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`,
      null,
      {
        headers: {
          'X-MBX-APIKEY': trade.apiKey,
        },
        timeout: 10000,
      }
    );

    trade.orders.push({
      orderId: response.data.orderId,
      side,
      quantity,
      price: limitPrice,
      timestamp: new Date(),
    });

    trade.totalInvested += amount;

    console.log(`[ALGO TRADING] ✅ Placed ${side} order for ${trade.symbol}: ${quantity} @ ${limitPrice}`);

    return response.data;
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error placing order:`, error.response?.data || error.message);
    throw error;
  }
}

// Close all positions
async function closeAllPositions(trade, reason) {
  try {
    // Get account balance for the base asset
    const baseAsset = trade.symbol.replace('USDT', '').replace('BUSD', '');
    
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', trade.apiSecret)
      .update(queryString)
      .digest('hex');

    const accountResponse = await axios.get(
      `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': trade.apiKey,
        },
        timeout: 10000,
      }
    );

    const balance = accountResponse.data.balances.find(
      b => b.asset === baseAsset && parseFloat(b.free) > 0
    );

    if (balance && parseFloat(balance.free) > 0) {
      // Place market sell order
      const sellTimestamp = Date.now();
      const sellQueryString = `symbol=${trade.symbol}&side=SELL&type=MARKET&quantity=${parseFloat(balance.free).toFixed(8)}&timestamp=${sellTimestamp}`;
      
      const sellSignature = crypto
        .createHmac('sha256', trade.apiSecret)
        .update(sellQueryString)
        .digest('hex');

      await axios.post(
        `https://api.binance.com/api/v3/order?${sellQueryString}&signature=${sellSignature}`,
        null,
        {
          headers: {
            'X-MBX-APIKEY': trade.apiKey,
          },
          timeout: 10000,
        }
      );

      console.log(`[ALGO TRADING] ✅ Closed all positions for ${trade.symbol} (Reason: ${reason})`);
    }

    // Stop the trade
    if (trade.intervalId) {
      clearInterval(trade.intervalId);
    }
    trade.isActive = false;
    trade.stoppedAt = new Date();
    trade.stopReason = reason;

    const tradeKey = `${trade.userId}:${trade.symbol}`;
    activeTrades.delete(tradeKey);

  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error closing positions:`, error.message);
  }
}

// Helper functions for technical indicators
function calculateSMA(prices, period) {
  if (prices.length < period) return [];
  
  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j];
    }
    sma.push(sum / period);
  }
  return sma;
}

function calculateEMA(prices, period) {
  if (prices.length < period) return [];
  
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(sum / period);
  
  // Calculate subsequent EMA values
  for (let i = period; i < prices.length; i++) {
    const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }
  return ema;
}

function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  
  // Align lengths
  const minLength = Math.min(emaFast.length, emaSlow.length);
  const fast = emaFast.slice(emaFast.length - minLength);
  const slow = emaSlow.slice(emaSlow.length - minLength);
  
  // Calculate MACD line (DIF)
  const dif = [];
  for (let i = 0; i < minLength; i++) {
    dif.push(fast[i] - slow[i]);
  }
  
  // Calculate Signal line (DEA) - EMA of DIF
  const signal = calculateEMA(dif, signalPeriod);
  
  // Calculate Histogram (MACD)
  const macdLength = Math.min(dif.length, signal.length);
  const macd = [];
  for (let i = 0; i < macdLength; i++) {
    const difIndex = dif.length - macdLength + i;
    const signalIndex = signal.length - macdLength + i;
    macd.push((dif[difIndex] - signal[signalIndex]) * 2);
  }
  
  return {
    macd: macd,
    signal: signal.slice(signal.length - macdLength),
  };
}

module.exports = router;
