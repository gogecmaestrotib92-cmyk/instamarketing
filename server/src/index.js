const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables - try server/.env first, then root .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

console.log('[SERVER] Starting server initialization...');
console.log('[SERVER] MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('[SERVER] JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Import routes with error handling
let authRoutes, postRoutes, reelRoutes, campaignRoutes, analyticsRoutes;
let scheduleRoutes, mediaRoutes, aiVideoRoutes, aiRoutes, advancedVideoRoutes;
let instagramRoutes, renderVideoRoutes, jobsRoutes;

try {
  console.log('[SERVER] Loading auth routes...');
  authRoutes = require('./routes/auth');
  console.log('[SERVER] Loading post routes...');
  postRoutes = require('./routes/posts');
  console.log('[SERVER] Loading reel routes...');
  reelRoutes = require('./routes/reels');
  console.log('[SERVER] Loading campaign routes...');
  campaignRoutes = require('./routes/campaigns');
  console.log('[SERVER] Loading analytics routes...');
  analyticsRoutes = require('./routes/analytics');
  console.log('[SERVER] Loading schedule routes...');
  scheduleRoutes = require('./routes/schedule');
  console.log('[SERVER] Loading media routes...');
  mediaRoutes = require('./routes/media');
  console.log('[SERVER] Loading ai-video routes...');
  aiVideoRoutes = require('./routes/ai-video');
  console.log('[SERVER] Loading ai routes...');
  aiRoutes = require('./routes/ai');
  console.log('[SERVER] Loading advancedVideo routes...');
  advancedVideoRoutes = require('./routes/advancedVideo');
  console.log('[SERVER] Loading instagram routes...');
  instagramRoutes = require('./routes/instagram');
  console.log('[SERVER] Loading render-video routes...');
  renderVideoRoutes = require('./routes/render-video');
  console.log('[SERVER] Loading jobs routes...');
  jobsRoutes = require('./routes/jobs');
  console.log('[SERVER] All routes loaded successfully!');
} catch (routeError) {
  console.error('[SERVER] FATAL: Failed to load routes:', routeError.message);
  console.error('[SERVER] Stack:', routeError.stack);
}

// Scheduler is optional (only available in development)
let initScheduler = null;
try {
  const scheduler = require('./services/scheduler');
  initScheduler = scheduler.initScheduler;
} catch (e) {
  console.log('Scheduler not available (node-cron not installed)');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instamarketing';
    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit in development - allow running without DB for testing
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

// Ensure DB is connected for every request (Vercel/Serverless)
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB();
    } catch (err) {
      console.error("Middleware DB Connect Error:", err);
      // Allow health check to proceed even if DB fails
      if (req.path === '/api/health') {
        return next();
      }
      return res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
  }
  next();
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint - MUST be before other routes to avoid crashes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState,
    dbStateLabel: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    env: {
      mongo: !!process.env.MONGODB_URI,
      mongoUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'NOT SET',
      jwt: !!process.env.JWT_SECRET,
      replicate: !!process.env.REPLICATE_API_TOKEN
    },
    routesLoaded: {
      auth: !!authRoutes,
      posts: !!postRoutes,
      reels: !!reelRoutes,
      campaigns: !!campaignRoutes,
      analytics: !!analyticsRoutes,
      schedule: !!scheduleRoutes,
      media: !!mediaRoutes,
      aiVideo: !!aiVideoRoutes,
      ai: !!aiRoutes,
      advancedVideo: !!advancedVideoRoutes,
      instagram: !!instagramRoutes,
      renderVideo: !!renderVideoRoutes,
      jobs: !!jobsRoutes
    },
    error: isConnected ? null : 'DB not connected'
  });
});

// API Routes - only register if loaded successfully
if (authRoutes) app.use('/api/auth', authRoutes);
if (postRoutes) app.use('/api/posts', postRoutes);
if (reelRoutes) app.use('/api/reels', reelRoutes);
if (campaignRoutes) app.use('/api/campaigns', campaignRoutes);
if (analyticsRoutes) app.use('/api/analytics', analyticsRoutes);
if (scheduleRoutes) app.use('/api/schedule', scheduleRoutes);
if (mediaRoutes) app.use('/api/media', mediaRoutes);
if (aiVideoRoutes) app.use('/api/ai-video', aiVideoRoutes);
if (aiRoutes) app.use('/api/ai', aiRoutes);
if (advancedVideoRoutes) app.use('/api/video', advancedVideoRoutes);
if (instagramRoutes) app.use('/api/instagram', instagramRoutes);
if (renderVideoRoutes) app.use('/api/render-video', renderVideoRoutes);
if (jobsRoutes) app.use('/api/jobs', jobsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    // Only init scheduler if available and not in serverless environment
    if (initScheduler && (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SCHEDULER === 'true')) {
      initScheduler();
    }
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
    });
  });
}

// Export for Vercel serverless
module.exports = app;

// Also export as handler for Vercel
module.exports.default = async (req, res) => {
  try {
    if (!isConnected) {
      await connectDB();
    }
  } catch (e) {
    console.error("Vercel Handler DB Error:", e);
    // If it's the health check, let it pass through
    if (req.url && req.url.includes('/api/health')) {
      return app(req, res);
    }
  }
  return app(req, res);
};
