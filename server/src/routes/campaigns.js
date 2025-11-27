const express = require('express');
const Campaign = require('../models/Campaign');
const { auth } = require('../middleware/auth');
const { createAdCampaign, updateAdCampaign, pauseCampaign, getCampaignInsights } = require('../services/metaAds');
const upload = require('../services/upload');

const router = express.Router();

// Get all campaigns for user
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.userId };
    if (status) query.status = status;

    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.userId });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create new campaign
router.post('/', auth, upload.array('media', 5), async (req, res) => {
  try {
    const { 
      name, 
      objective, 
      budget, 
      schedule, 
      targeting, 
      adCreative,
      abTest 
    } = req.body;

    // Process uploaded media files
    const media = req.files?.map((file) => ({
      localPath: file.path,
      url: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('video') ? 'video' : 'image'
    })) || [];

    // Parse JSON fields
    const parsedBudget = typeof budget === 'string' ? JSON.parse(budget) : budget;
    const parsedSchedule = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
    const parsedTargeting = typeof targeting === 'string' ? JSON.parse(targeting) : targeting;
    const parsedAdCreative = typeof adCreative === 'string' ? JSON.parse(adCreative) : adCreative;
    const parsedAbTest = abTest ? (typeof abTest === 'string' ? JSON.parse(abTest) : abTest) : undefined;

    // Add uploaded media to creative
    if (parsedAdCreative && media.length > 0) {
      parsedAdCreative.media = media;
    }

    const campaign = new Campaign({
      user: req.userId,
      name,
      objective,
      budget: parsedBudget,
      schedule: parsedSchedule,
      targeting: parsedTargeting,
      adCreative: parsedAdCreative,
      abTest: parsedAbTest,
      status: 'draft'
    });

    await campaign.save();

    res.status(201).json({ 
      message: 'Campaign created successfully',
      campaign 
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', auth, upload.array('media', 5), async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.userId });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Can only edit draft or paused campaigns
    if (!['draft', 'paused'].includes(campaign.status)) {
      return res.status(400).json({ error: 'Cannot edit active or completed campaign' });
    }

    const { 
      name, 
      objective, 
      budget, 
      schedule, 
      targeting, 
      adCreative,
      abTest 
    } = req.body;

    // Process uploaded media files
    const media = req.files?.map((file) => ({
      localPath: file.path,
      url: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('video') ? 'video' : 'image'
    })) || [];

    if (name) campaign.name = name;
    if (objective) campaign.objective = objective;
    if (budget) campaign.budget = typeof budget === 'string' ? JSON.parse(budget) : budget;
    if (schedule) campaign.schedule = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
    if (targeting) campaign.targeting = typeof targeting === 'string' ? JSON.parse(targeting) : targeting;
    if (adCreative) {
      campaign.adCreative = typeof adCreative === 'string' ? JSON.parse(adCreative) : adCreative;
      if (media.length > 0) {
        campaign.adCreative.media = [...(campaign.adCreative.media || []), ...media];
      }
    }
    if (abTest) campaign.abTest = typeof abTest === 'string' ? JSON.parse(abTest) : abTest;

    await campaign.save();

    // If campaign is on Meta, update it there too
    if (campaign.metaCampaignId && campaign.status === 'paused') {
      await updateAdCampaign(campaign, req.user);
    }

    res.json({ 
      message: 'Campaign updated successfully',
      campaign 
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Launch campaign
router.post('/:id/launch', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.userId });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!['draft', 'paused'].includes(campaign.status)) {
      return res.status(400).json({ error: 'Campaign cannot be launched in current state' });
    }

    if (!req.user.facebook?.connected) {
      return res.status(400).json({ error: 'Please connect your Facebook account to run ads' });
    }

    campaign.status = 'pending_review';
    await campaign.save();

    // Create campaign on Meta Ads
    const result = await createAdCampaign(campaign, req.user);

    if (result.success) {
      campaign.status = 'active';
      campaign.metaCampaignId = result.campaignId;
      campaign.metaAdSetId = result.adSetId;
      campaign.metaAdId = result.adId;
    } else {
      campaign.status = result.rejected ? 'rejected' : 'draft';
      campaign.errorMessage = result.error;
    }

    await campaign.save();

    res.json({ 
      message: result.success ? 'Campaign launched successfully' : 'Failed to launch campaign',
      campaign,
      success: result.success
    });
  } catch (error) {
    console.error('Launch campaign error:', error);
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
});

// Pause campaign
router.post('/:id/pause', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.userId });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ error: 'Can only pause active campaigns' });
    }

    // Pause on Meta
    if (campaign.metaCampaignId) {
      await pauseCampaign(campaign, req.user);
    }

    campaign.status = 'paused';
    await campaign.save();

    res.json({ 
      message: 'Campaign paused successfully',
      campaign 
    });
  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
});

// Resume campaign
router.post('/:id/resume', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.userId });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'paused') {
      return res.status(400).json({ error: 'Can only resume paused campaigns' });
    }

    // Resume on Meta
    const result = await createAdCampaign(campaign, req.user, true);

    if (result.success) {
      campaign.status = 'active';
    }

    await campaign.save();

    res.json({ 
      message: 'Campaign resumed successfully',
      campaign 
    });
  } catch (error) {
    console.error('Resume campaign error:', error);
    res.status(500).json({ error: 'Failed to resume campaign' });
  }
});

// Get campaign insights/metrics
router.get('/:id/insights', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.userId });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Fetch latest insights from Meta
    if (campaign.metaCampaignId) {
      const insights = await getCampaignInsights(campaign, req.user);
      
      if (insights.success) {
        campaign.metrics = insights.metrics;
        campaign.lastMetricsUpdate = new Date();
        await campaign.save();
      }
    }

    res.json({ 
      campaign,
      metrics: campaign.metrics
    });
  } catch (error) {
    console.error('Get campaign insights error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign insights' });
  }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.userId });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // If active, pause first
    if (campaign.status === 'active' && campaign.metaCampaignId) {
      await pauseCampaign(campaign, req.user);
    }

    await Campaign.deleteOne({ _id: campaign._id });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

module.exports = router;
