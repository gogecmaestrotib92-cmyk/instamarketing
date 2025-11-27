const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Content
  caption: {
    type: String,
    maxlength: 2200
  },
  hashtags: [{
    type: String
  }],
  // Video file
  video: {
    url: String,
    localPath: String,
    duration: Number, // in seconds
    thumbnail: String,
    width: Number,
    height: Number
  },
  // Cover image
  coverImage: {
    url: String,
    localPath: String
  },
  // Audio
  audio: {
    original: { type: Boolean, default: true },
    trackName: String,
    artistName: String
  },
  // Scheduling
  scheduledFor: Date,
  isScheduled: {
    type: Boolean,
    default: false
  },
  // Publishing status
  status: {
    type: String,
    enum: ['draft', 'processing', 'scheduled', 'publishing', 'published', 'failed'],
    default: 'draft'
  },
  // Instagram response data
  instagramReelId: String,
  instagramPermalink: String,
  publishedAt: Date,
  errorMessage: String,
  // Engagement metrics
  metrics: {
    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    accountsReached: { type: Number, default: 0 }
  },
  lastMetricsUpdate: Date
}, {
  timestamps: true
});

// Indexes
reelSchema.index({ user: 1, scheduledFor: 1 });
reelSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Reel', reelSchema);
