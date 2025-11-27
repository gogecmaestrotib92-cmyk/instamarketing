const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Campaign objective
  objective: {
    type: String,
    enum: [
      'awareness', // Brand awareness
      'reach', // Reach more people
      'traffic', // Drive traffic to website
      'engagement', // Get more engagement
      'leads', // Generate leads
      'sales', // Drive sales
      'app_installs' // Get app installs
    ],
    required: true
  },
  // Budget settings
  budget: {
    type: { type: String, enum: ['daily', 'lifetime'], default: 'daily' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  // Schedule
  schedule: {
    startDate: { type: Date, required: true },
    endDate: Date,
    runContinuously: { type: Boolean, default: false }
  },
  // Targeting
  targeting: {
    locations: [{
      type: String, // Country/City codes
      name: String
    }],
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 65 }
    },
    genders: [{
      type: String,
      enum: ['all', 'male', 'female']
    }],
    interests: [{
      id: String,
      name: String
    }],
    behaviors: [{
      id: String,
      name: String
    }],
    customAudiences: [{
      id: String,
      name: String
    }],
    lookalikeAudiences: [{
      id: String,
      name: String,
      sourceAudience: String
    }]
  },
  // Ad Creative
  adCreative: {
    headline: String,
    primaryText: String,
    description: String,
    callToAction: {
      type: String,
      enum: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'BOOK_NOW', 'CONTACT_US', 'DOWNLOAD', 'GET_QUOTE', 'APPLY_NOW']
    },
    destinationUrl: String,
    media: [{
      url: String,
      localPath: String,
      type: { type: String, enum: ['image', 'video'] }
    }]
  },
  // A/B Testing
  abTest: {
    enabled: { type: Boolean, default: false },
    variants: [{
      name: String,
      creative: {
        headline: String,
        primaryText: String,
        media: String
      },
      budget: Number,
      performance: {
        impressions: Number,
        clicks: Number,
        conversions: Number,
        spend: Number
      }
    }],
    winningVariant: String
  },
  // Campaign status
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'active', 'paused', 'completed', 'rejected'],
    default: 'draft'
  },
  // Meta/Facebook Ad IDs
  metaAdSetId: String,
  metaCampaignId: String,
  metaAdId: String,
  // Performance metrics
  metrics: {
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 }, // Click-through rate
    cpc: { type: Number, default: 0 }, // Cost per click
    cpm: { type: Number, default: 0 }, // Cost per 1000 impressions
    conversions: { type: Number, default: 0 },
    costPerConversion: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    roas: { type: Number, default: 0 } // Return on ad spend
  },
  lastMetricsUpdate: Date,
  errorMessage: String
}, {
  timestamps: true
});

// Indexes
campaignSchema.index({ user: 1, status: 1 });
campaignSchema.index({ user: 1, 'schedule.startDate': 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
