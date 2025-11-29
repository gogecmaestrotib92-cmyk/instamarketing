const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const reelRoutes = require('./routes/reels');
const campaignRoutes = require('./routes/campaigns');
const analyticsRoutes = require('./routes/analytics');
const scheduleRoutes = require('./routes/schedule');
const mediaRoutes = require('./routes/media');
const aiVideoRoutes = require('./routes/ai-video');
const aiRoutes = require('./routes/ai');
const advancedVideoRoutes = require('./routes/advancedVideo');
const instagramRoutes = require('./routes/instagram');
const renderVideoRoutes = require('./routes/render-video');

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/ai-video', aiVideoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/video', advancedVideoRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/render-video', renderVideoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    env: {
      mongo: !!process.env.MONGODB_URI,
      jwt: !!process.env.JWT_SECRET,
      replicate: !!process.env.REPLICATE_API_TOKEN
    },
    error: isConnected ? null : 'DB not connected'
  });
});

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
