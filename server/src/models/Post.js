const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Post type
  type: {
    type: String,
    enum: ['image', 'carousel', 'video'],
    required: true
  },
  // Content
  caption: {
    type: String,
    maxlength: 2200 // Instagram caption limit
  },
  hashtags: [{
    type: String
  }],
  location: {
    name: String,
    id: String // Instagram location ID
  },
  // Media files
  media: [{
    url: String,
    localPath: String,
    type: { type: String, enum: ['image', 'video'] },
    altText: String,
    order: Number
  }],
  // Scheduling
  scheduledFor: {
    type: Date
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  // Publishing status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'publishing', 'published', 'failed'],
    default: 'draft'
  },
  // Instagram response data
  instagramPostId: String,
  instagramPermalink: String,
  publishedAt: Date,
  errorMessage: String,
  // Engagement metrics (updated via webhook or polling)
  metrics: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 }
  },
  lastMetricsUpdate: Date
}, {
  timestamps: true
});

// Index for efficient queries
postSchema.index({ user: 1, scheduledFor: 1 });
postSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Post', postSchema);
