const axios = require('axios');

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';
const MARKETING_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Create an ad campaign on Meta Ads
 */
const createAdCampaign = async (campaign, user, resume = false) => {
  try {
    const accessToken = user.facebook.accessToken;
    const adAccountId = user.facebook.adAccountId;

    if (!accessToken || !adAccountId) {
      return { success: false, error: 'Facebook Ads not properly connected' };
    }

    // If resuming, just activate the existing campaign
    if (resume && campaign.metaCampaignId) {
      await axios.post(
        `${MARKETING_API_URL}/${campaign.metaCampaignId}`,
        {
          status: 'ACTIVE',
          access_token: accessToken
        }
      );
      return { success: true };
    }

    // Step 1: Create Campaign
    const campaignResponse = await axios.post(
      `${MARKETING_API_URL}/act_${adAccountId}/campaigns`,
      {
        name: campaign.name,
        objective: mapObjective(campaign.objective),
        status: 'PAUSED', // Start paused, activate after ad set and ad creation
        special_ad_categories: [],
        access_token: accessToken
      }
    );

    const metaCampaignId = campaignResponse.data.id;

    // Step 2: Create Ad Set
    const adSetResponse = await axios.post(
      `${MARKETING_API_URL}/act_${adAccountId}/adsets`,
      {
        name: `${campaign.name} - Ad Set`,
        campaign_id: metaCampaignId,
        daily_budget: campaign.budget.type === 'daily' ? campaign.budget.amount * 100 : undefined,
        lifetime_budget: campaign.budget.type === 'lifetime' ? campaign.budget.amount * 100 : undefined,
        start_time: campaign.schedule.startDate,
        end_time: campaign.schedule.endDate || undefined,
        billing_event: 'IMPRESSIONS',
        optimization_goal: mapOptimizationGoal(campaign.objective),
        targeting: buildTargeting(campaign.targeting),
        status: 'PAUSED',
        access_token: accessToken
      }
    );

    const metaAdSetId = adSetResponse.data.id;

    // Step 3: Create Ad Creative
    const creativeResponse = await axios.post(
      `${MARKETING_API_URL}/act_${adAccountId}/adcreatives`,
      {
        name: `${campaign.name} - Creative`,
        object_story_spec: buildCreativeSpec(campaign.adCreative, user.facebook.pageId),
        access_token: accessToken
      }
    );

    const creativeId = creativeResponse.data.id;

    // Step 4: Create Ad
    const adResponse = await axios.post(
      `${MARKETING_API_URL}/act_${adAccountId}/ads`,
      {
        name: `${campaign.name} - Ad`,
        adset_id: metaAdSetId,
        creative: { creative_id: creativeId },
        status: 'PAUSED',
        access_token: accessToken
      }
    );

    const metaAdId = adResponse.data.id;

    // Step 5: Activate everything
    await Promise.all([
      axios.post(`${MARKETING_API_URL}/${metaCampaignId}`, { status: 'ACTIVE', access_token: accessToken }),
      axios.post(`${MARKETING_API_URL}/${metaAdSetId}`, { status: 'ACTIVE', access_token: accessToken }),
      axios.post(`${MARKETING_API_URL}/${metaAdId}`, { status: 'ACTIVE', access_token: accessToken })
    ]);

    return {
      success: true,
      campaignId: metaCampaignId,
      adSetId: metaAdSetId,
      adId: metaAdId
    };
  } catch (error) {
    console.error('Error creating ad campaign:', error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.error?.message || error.message;
    const isRejected = errorMessage.includes('policy') || errorMessage.includes('rejected');
    
    return {
      success: false,
      rejected: isRejected,
      error: errorMessage
    };
  }
};

/**
 * Update an ad campaign
 */
const updateAdCampaign = async (campaign, user) => {
  try {
    const accessToken = user.facebook.accessToken;

    // Update campaign settings
    if (campaign.metaCampaignId) {
      await axios.post(
        `${MARKETING_API_URL}/${campaign.metaCampaignId}`,
        {
          name: campaign.name,
          access_token: accessToken
        }
      );
    }

    // Update ad set (targeting, budget)
    if (campaign.metaAdSetId) {
      await axios.post(
        `${MARKETING_API_URL}/${campaign.metaAdSetId}`,
        {
          daily_budget: campaign.budget.type === 'daily' ? campaign.budget.amount * 100 : undefined,
          targeting: buildTargeting(campaign.targeting),
          access_token: accessToken
        }
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating campaign:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Pause a campaign
 */
const pauseCampaign = async (campaign, user) => {
  try {
    const accessToken = user.facebook.accessToken;

    await axios.post(
      `${MARKETING_API_URL}/${campaign.metaCampaignId}`,
      {
        status: 'PAUSED',
        access_token: accessToken
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error pausing campaign:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get campaign insights/metrics
 */
const getCampaignInsights = async (campaign, user) => {
  try {
    const accessToken = user.facebook.accessToken;

    const response = await axios.get(
      `${MARKETING_API_URL}/${campaign.metaCampaignId}/insights`,
      {
        params: {
          fields: 'impressions,reach,clicks,ctr,cpc,cpm,spend,conversions,cost_per_conversion,actions',
          date_preset: 'maximum',
          access_token: accessToken
        }
      }
    );

    const data = response.data.data?.[0] || {};

    return {
      success: true,
      metrics: {
        impressions: parseInt(data.impressions) || 0,
        reach: parseInt(data.reach) || 0,
        clicks: parseInt(data.clicks) || 0,
        ctr: parseFloat(data.ctr) || 0,
        cpc: parseFloat(data.cpc) || 0,
        cpm: parseFloat(data.cpm) || 0,
        spend: parseFloat(data.spend) || 0,
        conversions: parseInt(data.conversions) || 0,
        costPerConversion: parseFloat(data.cost_per_conversion) || 0
      }
    };
  } catch (error) {
    console.error('Error getting campaign insights:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Map our objective to Meta's objective
 */
const mapObjective = (objective) => {
  const mapping = {
    'awareness': 'OUTCOME_AWARENESS',
    'reach': 'OUTCOME_AWARENESS',
    'traffic': 'OUTCOME_TRAFFIC',
    'engagement': 'OUTCOME_ENGAGEMENT',
    'leads': 'OUTCOME_LEADS',
    'sales': 'OUTCOME_SALES',
    'app_installs': 'OUTCOME_APP_PROMOTION'
  };
  return mapping[objective] || 'OUTCOME_AWARENESS';
};

/**
 * Map optimization goal
 */
const mapOptimizationGoal = (objective) => {
  const mapping = {
    'awareness': 'REACH',
    'reach': 'REACH',
    'traffic': 'LINK_CLICKS',
    'engagement': 'POST_ENGAGEMENT',
    'leads': 'LEAD_GENERATION',
    'sales': 'OFFSITE_CONVERSIONS',
    'app_installs': 'APP_INSTALLS'
  };
  return mapping[objective] || 'REACH';
};

/**
 * Build targeting spec for Meta API
 */
const buildTargeting = (targeting) => {
  const spec = {
    age_min: targeting.ageRange?.min || 18,
    age_max: targeting.ageRange?.max || 65,
  };

  // Locations
  if (targeting.locations?.length > 0) {
    spec.geo_locations = {
      countries: targeting.locations.map(l => l.type || l)
    };
  } else {
    // Default to US if no location specified
    spec.geo_locations = { countries: ['US'] };
  }

  // Gender
  if (targeting.genders?.length > 0 && !targeting.genders.includes('all')) {
    spec.genders = targeting.genders.map(g => g === 'male' ? 1 : 2);
  }

  // Interests
  if (targeting.interests?.length > 0) {
    spec.interests = targeting.interests.map(i => ({ id: i.id, name: i.name }));
  }

  // Custom audiences
  if (targeting.customAudiences?.length > 0) {
    spec.custom_audiences = targeting.customAudiences.map(a => ({ id: a.id }));
  }

  return spec;
};

/**
 * Build creative spec for Meta API
 */
const buildCreativeSpec = (creative, pageId) => {
  const media = creative.media?.[0];
  
  if (!media) {
    // Text-only ad
    return {
      page_id: pageId,
      link_data: {
        message: creative.primaryText,
        link: creative.destinationUrl,
        name: creative.headline,
        description: creative.description,
        call_to_action: {
          type: creative.callToAction || 'LEARN_MORE'
        }
      }
    };
  }

  if (media.type === 'video') {
    return {
      page_id: pageId,
      video_data: {
        video_id: media.id,
        message: creative.primaryText,
        title: creative.headline,
        link_description: creative.description,
        call_to_action: {
          type: creative.callToAction || 'LEARN_MORE',
          value: { link: creative.destinationUrl }
        }
      }
    };
  }

  return {
    page_id: pageId,
    link_data: {
      message: creative.primaryText,
      link: creative.destinationUrl,
      name: creative.headline,
      description: creative.description,
      image_hash: media.hash,
      call_to_action: {
        type: creative.callToAction || 'LEARN_MORE'
      }
    }
  };
};

module.exports = {
  createAdCampaign,
  updateAdCampaign,
  pauseCampaign,
  getCampaignInsights
};
