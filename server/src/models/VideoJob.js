/**
 * VIDEO JOB MODEL
 * ================
 * Tracks video generation jobs for async processing.
 * Allows multiple users to generate videos simultaneously.
 */

const mongoose = require('mongoose');

const SceneSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  text: { type: String, required: true },
  duration: { type: Number, default: 5 }, // seconds
  visual: { type: String }, // visual description for video search
  videoUrl: { type: String }, // Cloudinary URL after upload
  audioUrl: { type: String }, // Voiceover audio URL
  audioDuration: { type: Number } // Actual audio duration
});

const VideoJobSchema = new mongoose.Schema({
  // User info
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Input parameters
  topic: { type: String, required: true },
  contentType: { type: String, default: 'tips' }, // tips, facts, story, etc.
  targetDuration: { type: Number, default: 15 }, // 15, 30, 60 seconds
  voiceId: { type: String }, // ElevenLabs voice ID
  voiceStyle: { type: String, default: 'energetic' },
  
  // Job status
  status: {
    type: String,
    enum: ['pending', 'generating_script', 'finding_videos', 'generating_audio', 'rendering', 'done', 'failed'],
    default: 'pending'
  },
  progress: { type: Number, default: 0 }, // 0-100
  statusMessage: { type: String, default: 'Queued...' },
  
  // Generated content
  script: { type: String },
  scenes: [SceneSchema],
  subtitles: [{ 
    text: String, 
    start: Number, 
    end: Number 
  }],
  
  // Final output
  finalVideoUrl: { type: String }, // Shotstack rendered video
  audioUrl: { type: String }, // Combined voiceover
  totalDuration: { type: Number },
  
  // Shotstack job tracking
  shotstackJobId: { type: String },
  shotstackStatus: { type: String },
  
  // Error handling
  error: { type: String },
  retryCount: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

// Update timestamp on save
VideoJobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
VideoJobSchema.index({ userId: 1, createdAt: -1 });
VideoJobSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('VideoJob', VideoJobSchema);
