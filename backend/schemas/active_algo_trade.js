const mongoose = require('mongoose');

/**
 * Persisted state of active/waiting algo (or manual) trades.
 * Restored into memory on server startup so trades survive PM2/restart.
 * No API keys - credentials loaded from user.exchangeApis on restore.
 */
const activeAlgoTradeSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true, index: true },
  platform: { type: String, required: true },
  apiId: { type: String, required: true },
  isTest: { type: Boolean, default: false },
  isDemo: { type: Boolean, default: true },
  maxLossPerTrade: { type: Number, required: true },
  maxLossOverall: { type: Number, required: true },
  maxProfitBook: { type: Number, required: true },
  amountPerLevel: { type: Number, required: true },
  numberOfLevels: { type: Number, required: true },
  useMargin: { type: Boolean, default: false },
  leverage: { type: Number, default: 1 },
  isStarted: { type: Boolean, default: false },
  currentLevel: { type: Number, default: 0 },
  startPrice: { type: Number, default: 0 },
  tradeDirection: { type: String, default: null },
  totalInvested: { type: Number, default: 0 },
  realizedPnL: { type: Number, default: 0 },
  platformWalletFees: { type: [Number], default: [] },
  upfrontFee: { type: Number, required: true },
  startedAt: { type: Date, default: Date.now },
  lastSignal: { type: mongoose.Schema.Types.Mixed, default: null },
  isManual: { type: Boolean, default: false },
  isAdminMode: { type: Boolean, default: false },
  startLocation: { type: mongoose.Schema.Types.Mixed, default: null },
  orders: {
    type: [{
      side: String,
      price: Number,
      quantity: Number,
      timestamp: Date,
      orderId: String,
    }],
    default: [],
  },
}, { timestamps: true });

activeAlgoTradeSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const ActiveAlgoTrade = mongoose.models.ActiveAlgoTrade || mongoose.model('ActiveAlgoTrade', activeAlgoTradeSchema);

module.exports = ActiveAlgoTrade;
