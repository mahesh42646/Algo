const mongoose = require('mongoose');

/**
 * Permanent record of every completed/cancelled trade.
 * No API allows deletion - only developer can delete from database.
 */
const tradeHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  symbol: {
    type: String,
    required: true,
    index: true,
  },
  profit: {
    type: Number,
    required: true,
    default: 0,
  },
  stoppedAt: {
    type: Date,
    required: true,
    index: true,
  },
  stopReason: {
    type: String,
    default: null,
  },
  currentLevel: {
    type: Number,
    required: true,
    default: 0,
  },
  numberOfLevels: {
    type: Number,
    required: true,
    default: 0,
  },
  totalInvested: {
    type: Number,
    default: 0,
  },
  tradeDirection: {
    type: String,
    default: null,
  },
  platformWalletFees: {
    type: [Number],
    default: [],
  },
  totalFees: {
    type: Number,
    required: true,
    default: 0,
  },
  startPrice: { type: Number, default: null },
  startedAt: { type: Date, default: null },
  useMargin: { type: Boolean, default: false },
  leverage: { type: Number, default: 1 },
  maxProfitBook: { type: Number, default: null },
  amountPerLevel: { type: Number, default: null },
  isManual: { type: Boolean, default: false },
  isAdminMode: { type: Boolean, default: false },
  isTest: { type: Boolean, default: false },
  upfrontFee: { type: Number, default: null },
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
}, {
  timestamps: true,
});

tradeHistorySchema.index({ userId: 1, stoppedAt: -1 });
tradeHistorySchema.index({ userId: 1, symbol: 1, stoppedAt: -1 });

const TradeHistory = mongoose.model('TradeHistory', tradeHistorySchema);

module.exports = TradeHistory;
