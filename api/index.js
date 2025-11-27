// Vercel Serverless API Handler
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url.split('?')[0]; // Remove query params

  // Health check
  if (url === '/api/health' || url === '/api/health/') {
    return res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString()
    });
  }

  // Auth routes
  if (url === '/api/auth/me') {
    // Return user profile (requires valid token in production)
    return res.status(200).json({
      _id: 'user123',
      name: 'Demo User',
      email: 'demo@instamarketing.rs',
      plan: 'Pro',
      instagramConnected: false
    });
  }

  if (url === '/api/auth/login') {
    return res.status(200).json({
      token: 'demo-token',
      user: {
        _id: 'user123',
        name: 'Demo User',
        email: 'demo@instamarketing.rs',
        plan: 'Pro'
      }
    });
  }

  // Dashboard / Analytics routes
  if (url === '/api/analytics/dashboard') {
    return res.status(200).json({
      account: { connected: false },
      overview: {
        posts: { total: 0, published: 0, scheduled: 0 },
        reels: { total: 0, published: 0 },
        campaigns: { total: 0, active: 0 }
      },
      contentMetrics: {
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0
      }
    });
  }

  if (url === '/api/analytics/content') {
    return res.status(200).json({
      content: []
    });
  }

  if (url === '/api/analytics/best-times') {
    return res.status(200).json({
      bestTimes: [],
      timezone: 'Europe/Belgrade'
    });
  }

  // Posts routes
  if (url === '/api/posts') {
    return res.status(200).json({
      posts: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    });
  }

  // Reels routes
  if (url === '/api/reels') {
    return res.status(200).json({
      reels: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    });
  }

  // Campaigns routes
  if (url === '/api/campaigns') {
    return res.status(200).json({
      campaigns: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    });
  }

  // Schedule routes
  if (url === '/api/schedule' || url === '/api/schedule/calendar') {
    return res.status(200).json({
      scheduled: [],
      calendar: []
    });
  }

  // AI routes - return empty/demo data
  if (url.startsWith('/api/ai/')) {
    return res.status(200).json({
      success: true,
      message: 'AI features require server connection'
    });
  }

  // Default response for unhandled routes
  return res.status(200).json({ 
    message: 'Route not configured',
    path: url,
    hint: 'This demo deployment has limited API functionality'
  });
};
