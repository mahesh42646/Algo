const mongoose = require('mongoose');
const crypto = require('crypto');

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateWalletId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  nickname: {
    type: String,
    default: function() {
      return `User${this.userId.slice(-6)}`;
    },
    trim: true,
    maxlength: [50, 'Nickname cannot exceed 50 characters'],
  },
  avatar: {
    type: String,
    default: null,
  },
  location: {
    country: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
  },
  counselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'hi', 'ar'],
  },
  fcmToken: {
    type: String,
    default: null,
    sparse: true,
  },
  referralCode: {
    type: String,
    unique: true,
  },
  referrals: [{
    userId: {
      type: String,
      ref: 'User',
    },
    referredAt: {
      type: Date,
      default: Date.now,
    },
  }],
  activities: [{
    type: {
      type: String,
      required: true,
      enum: ['login', 'logout', 'profile_update', 'strategy_create', 'strategy_update', 'trade', 'deposit', 'withdrawal', 'kyc_submit', 'other'],
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  notifications: [{
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  strategies: [{
    strategyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Strategy',
      default: null,
    },
    name: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'paused'],
      default: 'active',
    },
    type: {
      type: String,
      enum: ['algo_trading', 'manual', 'other'],
      default: 'other',
    },
    symbol: {
      type: String,
      default: null,
    },
    platform: {
      type: String,
      default: null,
    },
    config: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  }],
  wallet: {
    walletId: {
      type: String,
      unique: true,
    },
    tronTest: {
      address: {
        type: String,
        default: null,
      },
      privateKeyEncrypted: {
        type: String,
        default: null,
      },
      createdAt: {
        type: Date,
        default: null,
      },
    },
    tronProd: {
      address: {
        type: String,
        default: null,
      },
      privateKeyEncrypted: {
        type: String,
        default: null,
      },
      createdAt: {
        type: Date,
        default: null,
      },
    },
    depositStatus: {
      type: String,
      enum: ['none', 'pending', 'confirmed', 'failed'],
      default: 'none',
    },
    lastDepositTx: {
      type: String,
      default: null,
    },
    unsweptFunds: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSwept: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSweepAt: {
      type: Date,
      default: null,
    },
    balances: [{
      currency: {
        type: String,
        required: true,
        uppercase: true,
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
    }],
    transactions: [{
      type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'transfer', 'trade', 'fee', 'reward'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        required: true,
        uppercase: true,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
      },
      description: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free',
    },
    permissions: [{
      type: String,
      enum: [
        'use_platform',
        'update_profile',
        'see_others_profile',
        'raise_disputes',
        'create_strategies',
        'advanced_analytics',
        'priority_support',
        'api_access',
        'white_label',
      ],
    }],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  kyc: [{
    type: {
      type: String,
      enum: ['identity', 'address', 'bank', 'tax'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
    },
    documents: [{
      type: {
        type: String,
        enum: ['passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement', 'tax_document'],
      },
      url: {
        type: String,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
    },
  }],
  exchangeApis: [{
    platform: {
      type: String,
      required: true,
      enum: ['binance', 'kucoin', 'bybit', 'okx', 'gate.io', 'huobi'],
    },
    apiKey: {
      type: String,
      required: true,
    },
    apiSecret: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: 'Default',
    },
    isTest: {
      type: Boolean,
      default: false,
    },
    permissions: [{
      type: String,
      enum: ['read', 'spot_trade', 'futures_trade', 'withdraw'],
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this.referralCode) {
      let code = generateReferralCode();
      let exists = true;
      while (exists) {
        const user = await this.constructor.findOne({ referralCode: code });
        exists = !!user;
        if (exists) code = generateReferralCode();
      }
      this.referralCode = code;
    }
    
    if (!this.wallet?.walletId) {
      let id = generateWalletId();
      let exists = true;
      while (exists) {
        const user = await this.constructor.findOne({ 'wallet.walletId': id });
        exists = !!user;
        if (exists) id = generateWalletId();
      }
      if (!this.wallet) this.wallet = {};
      this.wallet.walletId = id;
    }

    if (!this.subscription?.permissions || this.subscription.permissions.length === 0) {
      if (!this.subscription) this.subscription = {};
      this.subscription.permissions = ['use_platform', 'update_profile', 'see_others_profile', 'raise_disputes'];
    }
  }
  next();
});

// Indexes - userId and email already have unique indexes from schema definition
// userSchema.index({ userId: 1 }); // Already indexed via unique: true
// userSchema.index({ email: 1 }); // Already indexed via unique: true
// userSchema.index({ referralCode: 1 }); // Already indexed via unique: true
// userSchema.index({ 'wallet.walletId': 1 }); // Already indexed via unique: true
userSchema.index({ 'subscription.plan': 1 });

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  if (obj.wallet?.tronTest?.privateKeyEncrypted) {
    delete obj.wallet.tronTest.privateKeyEncrypted;
  }
  if (obj.wallet?.tronProd?.privateKeyEncrypted) {
    delete obj.wallet.tronProd.privateKeyEncrypted;
  }
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
