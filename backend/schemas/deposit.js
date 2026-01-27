const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  address: {
    type: String,
    required: true,
    index: true,
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
  },
  chain: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  contractAddress: {
    type: String,
    default: null,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['detected', 'gas_funded', 'sweeping', 'sweep_failed', 'held', 'completed', 'failed', 'retrying'],
    default: 'detected',
  },
  balanceCredited: {
    type: Boolean,
    default: false,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  lastRetryAt: {
    type: Date,
    default: null,
  },
  error: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

const Deposit = mongoose.model('Deposit', depositSchema);

module.exports = Deposit;
