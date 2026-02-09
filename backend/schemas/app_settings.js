const mongoose = require('mongoose');

const strategyItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['admin', 'popular'], required: true },
  description: { type: String, default: '', trim: true },
  maxLossPerTrade: { type: Number, default: 3 },
  maxLossOverall: { type: Number, default: 3 },
  maxProfitBook: { type: Number, default: 3 },
  amountPerLevel: { type: Number, default: 10 },
  numberOfLevels: { type: Number, default: 10 },
  isDefault: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: true });

const appSettingsSchema = new mongoose.Schema({
  // Single document (use findOne)
  appName: { type: String, default: 'AlgoBot', trim: true, maxlength: 100 },
  appIconUrl: { type: String, default: '', trim: true },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  language: { type: String, default: 'en', trim: true, maxlength: 10 },
  platformChargeType: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  platformChargeValue: { type: Number, default: 0.3 },
  adminStrategies: [strategyItemSchema],
  popularStrategies: [strategyItemSchema],
  updatedAt: { type: Date, default: Date.now },
  updateNotes: { type: String, default: '', trim: true },
}, { timestamps: false, collection: 'appsettings' });

appSettingsSchema.index({ updatedAt: 1 });

const AppSettings = mongoose.models.AppSettings || mongoose.model('AppSettings', appSettingsSchema);

module.exports = AppSettings;
