const express = require('express');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Campaign = require('../models/Campaign');
const { auth } = require('../middleware/auth');
const { getAccountInsights, getMediaInsights } = require('../services/instagram');

const router = express.Router();

// Get dashboard overview
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;

    // Date range for queries
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get counts
    const [
      totalPosts,
      publishedPosts,
      scheduledPosts,
      totalReels,
      publishedReels,
      activeCampaigns,
      totalCampaigns
    ] = await Promise.all([
      Post.countDocuments({ user: userId }),
      Post.countDocuments({ user: userId, status: 'published' }),
      Post.countDocuments({ user: userId, status: 'scheduled' }),
      Reel.countDocuments({ user: userId }),
      Reel.countDocuments({ user: userId, status: 'published' }),
      Campaign.countDocuments({ user: userId, status: 'active' }),
      Campaign.countDocuments({ user: userId })
    ]);

    // Get recent published content metrics
    const recentPosts = await Post.find({ 
      user: userId, 
      status: 'published' 
    })
    .sort({ publishedAt: -1 })
    .limit(5)
    .select('caption type metrics publishedAt instagramPermalink');

    const recentReels = await Reel.find({ 
      user: userId, 
      status: 'published' 
    })
    .sort({ publishedAt: -1 })
    .limit(5)
    .select('caption metrics publishedAt instagramPermalink');

    // Calculate totals
    const allPublishedPosts = await Post.find({ user: userId, status: 'published' });
    const allPublishedReels = await Reel.find({ user: userId, status: 'published' });

    const totalMetrics = {
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      reach: 0,
      impressions: 0,
      plays: 0
    };

    allPublishedPosts.forEach(post => {
      totalMetrics.likes += post.metrics?.likes || 0;
      totalMetrics.comments += post.metrics?.comments || 0;
      totalMetrics.shares += post.metrics?.shares || 0;
      totalMetrics.saves += post.metrics?.saves || 0;
      totalMetrics.reach += post.metrics?.reach || 0;
      totalMetrics.impressions += post.metrics?.impressions || 0;
    });

    allPublishedReels.forEach(reel => {
      totalMetrics.plays += reel.metrics?.plays || 0;
      totalMetrics.likes += reel.metrics?.likes || 0;
      totalMetrics.comments += reel.metrics?.comments || 0;
      totalMetrics.shares += reel.metrics?.shares || 0;
      totalMetrics.saves += reel.metrics?.saves || 0;
      totalMetrics.reach += reel.metrics?.reach || 0;
    });

    // Get campaign metrics
    const campaigns = await Campaign.find({ user: userId, status: { $in: ['active', 'completed'] } });
    const campaignMetrics = {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0
    };

    campaigns.forEach(campaign => {
      campaignMetrics.totalSpend += campaign.metrics?.spend || 0;
      campaignMetrics.totalImpressions += campaign.metrics?.impressions || 0;
      campaignMetrics.totalClicks += campaign.metrics?.clicks || 0;
      campaignMetrics.totalConversions += campaign.metrics?.conversions || 0;
    });

    // Check connection status (DB or Env fallback)
    let accountStatus = { connected: false };
    
    // Debug logging
    console.log('Dashboard Analytics - User ID:', userId);
    console.log('User Instagram Data:', JSON.stringify(req.user.instagram));
    
    if (req.user.instagram && req.user.instagram.connected) {
      console.log('Using DB connection');
      accountStatus = {
        username: req.user.instagram.username,
        followers: req.user.instagram.followersCount,
        connected: true
      };
    } else if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      console.log('Using Env connection fallback');
      // Fallback to env vars for single-user mode
      accountStatus = {
        username: 'Instagram User', // We might not have the username if only in env
        connected: true,
        isEnvConnection: true
      };
      
      // Try to get username if we have the token
      try {
        // This is async but we don't want to block the dashboard load too much
        // Ideally we should cache this or store it in DB on startup
      } catch (e) {}
    } else {
      console.log('No connection found');
    }

    res.json({
      overview: {
        posts: {
          total: totalPosts,
          published: publishedPosts,
          scheduled: scheduledPosts
        },
        reels: {
          total: totalReels,
          published: publishedReels
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns
        }
      },
      contentMetrics: totalMetrics,
      campaignMetrics,
      recentContent: {
        posts: recentPosts,
        reels: recentReels
      },
      account: accountStatus
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Get content performance
router.get('/content', auth, async (req, res) => {
  try {
    const { type = 'all', period = '30d', sortBy = 'engagement' } = req.query;
    
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let posts = [];
    let reels = [];

    if (type === 'all' || type === 'posts') {
      posts = await Post.find({
        user: req.userId,
        status: 'published',
        publishedAt: { $gte: startDate }
      }).sort({ publishedAt: -1 });
    }

    if (type === 'all' || type === 'reels') {
      reels = await Reel.find({
        user: req.userId,
        status: 'published',
        publishedAt: { $gte: startDate }
      }).sort({ publishedAt: -1 });
    }

    // Calculate engagement rate for sorting
    const calculateEngagement = (metrics) => {
      const total = (metrics?.likes || 0) + 
                   (metrics?.comments || 0) + 
                   (metrics?.shares || 0) + 
                   (metrics?.saves || 0);
      return total;
    };

    const allContent = [
      ...posts.map(p => ({ ...p.toObject(), contentType: 'post', engagement: calculateEngagement(p.metrics) })),
      ...reels.map(r => ({ ...r.toObject(), contentType: 'reel', engagement: calculateEngagement(r.metrics) }))
    ];

    // Sort by engagement or date
    if (sortBy === 'engagement') {
      allContent.sort((a, b) => b.engagement - a.engagement);
    } else {
      allContent.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }

    res.json({
      content: allContent,
      period: `${days} days`,
      totalItems: allContent.length
    });
  } catch (error) {
    console.error('Content analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch content analytics' });
  }
});

// Get campaign analytics
router.get('/campaigns', auth, async (req, res) => {
  try {
    const { status, period = '30d' } = req.query;

    const query = { user: req.userId };
    if (status) query.status = status;

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    // Calculate aggregate metrics
    const aggregateMetrics = {
      totalSpend: 0,
      totalImpressions: 0,
      totalReach: 0,
      totalClicks: 0,
      totalConversions: 0,
      averageCTR: 0,
      averageCPC: 0,
      averageROAS: 0
    };

    let campaignsWithMetrics = 0;

    campaigns.forEach(campaign => {
      if (campaign.metrics) {
        aggregateMetrics.totalSpend += campaign.metrics.spend || 0;
        aggregateMetrics.totalImpressions += campaign.metrics.impressions || 0;
        aggregateMetrics.totalReach += campaign.metrics.reach || 0;
        aggregateMetrics.totalClicks += campaign.metrics.clicks || 0;
        aggregateMetrics.totalConversions += campaign.metrics.conversions || 0;
        
        if (campaign.metrics.ctr) {
          aggregateMetrics.averageCTR += campaign.metrics.ctr;
          campaignsWithMetrics++;
        }
      }
    });

    if (campaignsWithMetrics > 0) {
      aggregateMetrics.averageCTR /= campaignsWithMetrics;
    }

    if (aggregateMetrics.totalClicks > 0) {
      aggregateMetrics.averageCPC = aggregateMetrics.totalSpend / aggregateMetrics.totalClicks;
    }

    res.json({
      campaigns,
      aggregateMetrics,
      totalCampaigns: campaigns.length
    });
  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

// Get Instagram account insights
router.get('/account', auth, async (req, res) => {
  try {
    if (!req.user.instagram?.connected) {
      return res.status(400).json({ error: 'Instagram account not connected' });
    }

    const insights = await getAccountInsights(req.user);

    res.json({
      account: {
        username: req.user.instagram.username,
        profilePicture: req.user.instagram.profilePicture,
        followers: req.user.instagram.followersCount
      },
      insights: insights.data || null,
      success: insights.success
    });
  } catch (error) {
    console.error('Account insights error:', error);
    res.status(500).json({ error: 'Failed to fetch account insights' });
  }
});

// Get best posting times analysis
router.get('/best-times', auth, async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.userId,
      status: 'published',
      publishedAt: { $exists: true }
    }).select('publishedAt metrics');

    const reels = await Reel.find({
      user: req.userId,
      status: 'published',
      publishedAt: { $exists: true }
    }).select('publishedAt metrics');

    // Analyze by hour and day of week
    const hourlyPerformance = Array(24).fill(null).map(() => ({ count: 0, totalEngagement: 0 }));
    const dailyPerformance = Array(7).fill(null).map(() => ({ count: 0, totalEngagement: 0 }));

    const analyzeContent = (items) => {
      items.forEach(item => {
        const date = new Date(item.publishedAt);
        const hour = date.getHours();
        const day = date.getDay();
        const engagement = (item.metrics?.likes || 0) + (item.metrics?.comments || 0);

        hourlyPerformance[hour].count++;
        hourlyPerformance[hour].totalEngagement += engagement;

        dailyPerformance[day].count++;
        dailyPerformance[day].totalEngagement += engagement;
      });
    };

    analyzeContent(posts);
    analyzeContent(reels);

    // Calculate averages
    const hourlyAverages = hourlyPerformance.map((h, i) => ({
      hour: i,
      averageEngagement: h.count > 0 ? h.totalEngagement / h.count : 0,
      postsCount: h.count
    }));

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyAverages = dailyPerformance.map((d, i) => ({
      day: days[i],
      dayIndex: i,
      averageEngagement: d.count > 0 ? d.totalEngagement / d.count : 0,
      postsCount: d.count
    }));

    // Find best times
    const bestHours = [...hourlyAverages]
      .filter(h => h.postsCount >= 2)
      .sort((a, b) => b.averageEngagement - a.averageEngagement)
      .slice(0, 5);

    const bestDays = [...dailyAverages]
      .filter(d => d.postsCount >= 2)
      .sort((a, b) => b.averageEngagement - a.averageEngagement)
      .slice(0, 3);

    res.json({
      hourlyAnalysis: hourlyAverages,
      dailyAnalysis: dailyAverages,
      recommendations: {
        bestHours,
        bestDays
      },
      totalContentAnalyzed: posts.length + reels.length
    });
  } catch (error) {
    console.error('Best times analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze best posting times' });
  }
});

module.exports = router;
