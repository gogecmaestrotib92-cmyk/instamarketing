// Vercel Serverless API Handler with AI Integration

// MongoDB connection for persistent job storage
const mongoose = require('mongoose');
let isDbConnected = false;

async function connectDB() {
  if (isDbConnected) return;
  if (!process.env.MONGODB_URI) {
    console.log('No MONGODB_URI - using in-memory fallback');
    return;
  }
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 1
      });
    }
    isDbConnected = true;
    console.log('✅ MongoDB connected for Vercel');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
}

// Premium Job Schema (inline for Vercel)
const premiumJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  userId: { type: String, index: true }, // For auto-saving to Asset Hub
  status: { type: String, default: 'pending' },
  progress: { type: Number, default: 0 },
  statusMessage: { type: String, default: 'Starting...' },
  videoUrl: String,
  audioUrl: String,
  voiceoverScript: String,
  error: String,
  input: mongoose.Schema.Types.Mixed,
  savedToAssetHub: { type: Boolean, default: false }, // Track if user has synced this
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

let PremiumJob;
try {
  PremiumJob = mongoose.model('PremiumJob');
} catch {
  PremiumJob = mongoose.model('PremiumJob', premiumJobSchema);
}

module.exports = async (req, res) => {
  // Connect to DB first
  await connectDB();
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url.split('?')[0]; // Remove query params

  try {
    // Health check
    if (url === '/api/health' || url === '/api/health/') {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        replicate: !!process.env.REPLICATE_API_TOKEN,
        openai: !!process.env.OPENAI_API_KEY
      });
    }

    // Auth routes
    if (url === '/api/auth/me') {
      // Check if user has Instagram connected via environment variables
      const hasInstagram = !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID);
      
      return res.status(200).json({
        _id: 'user123',
        name: 'Demo User',
        email: 'demo@instamarketing.rs',
        plan: 'Pro',
        instagramConnected: hasInstagram,
        instagram: hasInstagram ? {
          connected: true,
          accountId: process.env.INSTAGRAM_ACCOUNT_ID,
          username: process.env.INSTAGRAM_USERNAME || 'connected_account'
        } : null
      });
    }

    if (url === '/api/auth/login' && req.method === 'POST') {
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

    // Connect Instagram with access token
    if (url === '/api/auth/connect/instagram/token' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { accessToken } = body || {};

      if (!accessToken) {
        return res.status(400).json({ error: 'Access token je obavezan' });
      }

      try {
        // Verify token and get user's pages
        const fetch = require('node-fetch');
        
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
        );
        const pagesData = await pagesResponse.json();

        if (pagesData.error) {
          return res.status(400).json({ error: pagesData.error.message });
        }

        if (!pagesData.data || pagesData.data.length === 0) {
          return res.status(400).json({ 
            error: 'Nema pronađenih Facebook stranica. Potrebna vam je Facebook stranica povezana sa Instagram Business nalogom.' 
          });
        }

        // Get Instagram Business Account from first page
        const page = pagesData.data[0];
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        );
        const igData = await igResponse.json();

        if (!igData.instagram_business_account) {
          return res.status(400).json({ 
            error: 'Nema Instagram Business naloga povezanog sa ovom Facebook stranicom. Povežite vaš Instagram nalog sa Facebook stranicom.' 
          });
        }

        const igAccountId = igData.instagram_business_account.id;

        // Get Instagram account details
        const detailsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${page.access_token}`
        );
        const details = await detailsResponse.json();

        return res.status(200).json({
          success: true,
          message: 'Instagram nalog uspešno povezan!',
          instagram: {
            accountId: igAccountId,
            username: details.username,
            name: details.name,
            profilePicture: details.profile_picture_url,
            followers: details.followers_count,
            mediaCount: details.media_count
          },
          note: 'Da biste trajno sačuvali povezanost, dodajte INSTAGRAM_ACCESS_TOKEN i INSTAGRAM_ACCOUNT_ID u Vercel Environment Variables.'
        });

      } catch (error) {
        console.error('Instagram connect error:', error);
        return res.status(500).json({ error: 'Greška pri povezivanju Instagram naloga: ' + error.message });
      }
    }

    // Auto-connect Instagram using environment variables
    if (url === '/api/auth/connect/instagram/auto' && req.method === 'POST') {
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

      if (!accessToken || !accountId) {
        return res.status(400).json({ 
          error: 'Instagram kredencijali nisu konfigurisani. Dodajte INSTAGRAM_ACCESS_TOKEN i INSTAGRAM_ACCOUNT_ID u Vercel Environment Variables.' 
        });
      }

      try {
        const fetch = require('node-fetch');
        
        // Get Instagram account details
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${accountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
        );
        const data = await response.json();

        if (data.error) {
          return res.status(400).json({ error: data.error.message });
        }

        return res.status(200).json({
          success: true,
          message: 'Instagram nalog uspešno povezan!',
          instagram: {
            accountId: accountId,
            username: data.username,
            name: data.name,
            profilePicture: data.profile_picture_url,
            followers: data.followers_count,
            mediaCount: data.media_count
          }
        });

      } catch (error) {
        console.error('Instagram auto-connect error:', error);
        return res.status(500).json({ error: 'Greška pri povezivanju: ' + error.message });
      }
    }

    // Disconnect Instagram
    if (url === '/api/auth/disconnect/instagram' && req.method === 'POST') {
      return res.status(200).json({
        success: true,
        message: 'Instagram nalog je odvojen. Da biste potpuno uklonili vezu, obrišite INSTAGRAM_ACCESS_TOKEN iz Vercel Environment Variables.'
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
        contentMetrics: { likes: 0, comments: 0, shares: 0, saves: 0 }
      });
    }

    if (url === '/api/analytics/content') {
      return res.status(200).json({ content: [] });
    }

    if (url === '/api/analytics/best-times') {
      return res.status(200).json({ bestTimes: [], timezone: 'Europe/Belgrade' });
    }

    // Posts, Reels, Campaigns routes
    if (url === '/api/posts') {
      return res.status(200).json({ posts: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });
    }
    if (url === '/api/reels') {
      return res.status(200).json({ reels: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });
    }
    if (url === '/api/campaigns') {
      return res.status(200).json({ campaigns: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });
    }
    if (url === '/api/schedule' || url === '/api/schedule/calendar') {
      return res.status(200).json({ scheduled: [], calendar: {} });
    }

    // My Videos
    if (url === '/api/ai-video/my-videos') {
      return res.status(200).json({ videos: [] });
    }

    // ==================== AI VIDEO GENERATION ====================
    
    // Text to Video - Start async generation
    if (url === '/api/ai-video/text-to-video' && req.method === 'POST') {
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: 'REPLICATE_API_TOKEN nije konfigurisan u Vercel Environment Variables' });
      }

      const Replicate = require('replicate');
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { prompt, duration = 5, aspectRatio = '9:16' } = body || {};

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt je obavezan' });
      }

      console.log('🎬 Starting Luma Ray Flash 2 video generation:', prompt);
      console.log('   Duration:', duration, 'Aspect Ratio:', aspectRatio);

      try {
        // Use Luma Ray Flash 2 - high quality, fast, supports 9:16
        // Model: luma/ray-flash-2-720p for 720p quality
        // Duration must be integer: 5 or 9 seconds
        const lumaDuration = parseInt(duration) >= 9 ? 9 : 5;
        
        const prediction = await replicate.predictions.create({
          model: "luma/ray-flash-2-720p",
          input: {
            prompt: prompt,
            aspect_ratio: aspectRatio,
            duration: lumaDuration,
            loop: false
          }
        });

        console.log('📝 Prediction created:', prediction.id);

        // Return immediately with prediction ID - client will poll for status
        return res.status(200).json({
          success: true,
          status: 'processing',
          predictionId: prediction.id,
          message: 'Video se generiše. Sačekajte 2-3 minuta...',
          video: {
            id: prediction.id,
            status: 'processing',
            prompt,
            duration,
            aspectRatio
          }
        });
      } catch (error) {
        console.error('Replicate error:', error);
        if (error.message?.includes('Payment') || error.message?.includes('402') || error.message?.includes('billing')) {
          return res.status(402).json({ 
            error: 'Payment required. Add a payment method at replicate.com/account/billing',
            requiresPayment: true
          });
        }
        throw error;
      }
    }

    // Check video generation status (supports both GET and POST)
    if (url === '/api/ai-video/status' && (req.method === 'GET' || req.method === 'POST')) {
      const body = req.method === 'POST' ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {};
      const predictionId = body.id || req.query?.id || url.split('?id=')[1];
      
      if (!predictionId) {
        return res.status(400).json({ error: 'Prediction ID je obavezan' });
      }

      const Replicate = require('replicate');
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

      try {
        const prediction = await replicate.predictions.get(predictionId);

        if (prediction.status === 'succeeded') {
          return res.status(200).json({
            success: true,
            status: 'completed',
            video: {
              id: prediction.id,
              videoUrl: prediction.output,
              status: 'completed'
            }
          });
        } else if (prediction.status === 'failed') {
          return res.status(500).json({
            success: false,
            status: 'failed',
            error: prediction.error || 'Video generation failed'
          });
        } else {
          return res.status(200).json({
            success: true,
            status: prediction.status, // 'starting' or 'processing'
            message: 'Video se još generiše...'
          });
        }
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    // Start async video generation
    if (url === '/api/ai/video/start' && req.method === 'POST') {
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: 'REPLICATE_API_TOKEN nije konfigurisan' });
      }

      const Replicate = require('replicate');
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { prompt } = body || {};

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt je obavezan' });
      }

      // Start prediction without waiting
      const prediction = await replicate.predictions.create({
        model: "minimax/video-01",
        input: {
          prompt: prompt,
          prompt_optimizer: true
        }
      });

      return res.status(200).json({
        success: true,
        predictionId: prediction.id,
        status: prediction.status
      });
    }

    // Check video status
    if (url.startsWith('/api/ai/video/status/') && req.method === 'GET') {
      const predictionId = url.split('/').pop();
      
      if (!predictionId) {
        return res.status(400).json({ error: 'Prediction ID je obavezan' });
      }

      const Replicate = require('replicate');
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

      const prediction = await replicate.predictions.get(predictionId);

      return res.status(200).json({
        status: prediction.status,
        output: prediction.output,
        error: prediction.error
      });
    }

    // ==================== PREMIUM AI VIDEO (Job-Based) ====================
    
    // In-memory job storage for serverless (persists within same instance)
    if (!global.premiumJobs) {
      global.premiumJobs = {};
    }

    // Start Premium AI Video Job (with MongoDB persistence)
    if (url === '/api/ai/video/start-premium' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { 
        prompt,
        businessName,
        industry,
        contentPurpose,
        aspectRatio = '9:16',
        voice,
        includeSubtitles = true,
        subtitleStyle = 'modern',
        logoUrl = null,
        logoPosition = 'topRight',
        logoSize = 0.12
      } = body || {};

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Generate unique job ID
      const jobId = `premium-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`\n🎬 [${jobId}] Starting Premium AI Video Job`);

      const jobData = {
        jobId: jobId,
        status: 'pending',
        progress: 0,
        statusMessage: 'Starting...',
        createdAt: new Date(),
        input: { prompt, businessName, industry, contentPurpose, aspectRatio, voice, includeSubtitles, subtitleStyle, logoUrl, logoPosition, logoSize }
      };

      // Save to MongoDB if available, otherwise use in-memory
      if (isDbConnected && PremiumJob) {
        try {
          await PremiumJob.create(jobData);
          console.log(`[${jobId}] ✅ Job saved to MongoDB`);
        } catch (dbErr) {
          console.error(`[${jobId}] MongoDB save failed:`, dbErr.message);
          // Fallback to in-memory
          if (!global.premiumJobs) global.premiumJobs = {};
          global.premiumJobs[jobId] = jobData;
        }
      } else {
        if (!global.premiumJobs) global.premiumJobs = {};
        global.premiumJobs[jobId] = jobData;
      }

      // Start processing in background (fire and forget)
      processPremiumJobVercel(jobId).catch(err => {
        console.error(`[${jobId}] Background process error:`, err.message);
        updatePremiumJobStatus(jobId, { status: 'failed', error: err.message });
      });

      // Return immediately
      return res.status(200).json({
        success: true,
        jobId: jobId,
        status: 'pending',
        message: 'Premium video job started. Poll /api/ai/video/premium-job-status for progress.'
      });
    }

    // Poll Premium Job Status (from MongoDB or in-memory)
    if (url === '/api/ai/video/premium-job-status' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { jobId } = body || {};

      if (!jobId) {
        return res.status(400).json({ error: 'jobId is required' });
      }

      // Try MongoDB first, then in-memory
      let job = null;
      if (isDbConnected && PremiumJob) {
        try {
          job = await PremiumJob.findOne({ jobId }).lean();
        } catch (dbErr) {
          console.error('MongoDB query error:', dbErr.message);
        }
      }
      
      // Fallback to in-memory
      if (!job && global.premiumJobs) {
        job = global.premiumJobs[jobId];
      }
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found. Please try again or start a new generation.' });
      }

      return res.status(200).json({
        success: true,
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        statusMessage: job.statusMessage,
        videoUrl: job.videoUrl,
        audioUrl: job.audioUrl,
        voiceoverScript: job.voiceoverScript,
        error: job.error
      });
    }

    // ==================== AI TEXT GENERATION (OpenAI) ====================

    // Caption generation
    if (url === '/api/ai/caption' && req.method === 'POST') {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan u Vercel Environment Variables' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { topic, tone = 'engaging', includeEmojis = true, includeHashtags = true } = body || {};

      if (!topic) {
        return res.status(400).json({ error: 'Topic je obavezan' });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Napiši Instagram caption na srpskom jeziku za temu: "${topic}".
Ton: ${tone}
${includeEmojis ? 'Uključi relevantne emoji.' : 'Bez emoji.'}
${includeHashtags ? 'Dodaj 5-10 relevantnih hashtag-ova na kraju.' : 'Bez hashtag-ova.'}
Caption treba biti engaging i pozivati na akciju.`
        }],
        max_tokens: 500
      });

      return res.status(200).json({ caption: completion.choices[0].message.content });
    }

    // Hashtag generation
    if (url === '/api/ai/hashtags' && req.method === 'POST') {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { topic, count = 15 } = body || {};

      if (!topic) {
        return res.status(400).json({ error: 'Topic je obavezan' });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Generiši ${count} Instagram hashtag-ova za temu: "${topic}".
Uključi miks popularnih i niche hashtag-ova.
Vrati samo hashtag-ove, svaki u novom redu, bez numerisanja.`
        }],
        max_tokens: 300
      });

      const hashtags = completion.choices[0].message.content
        .split('\n')
        .map(h => h.trim())
        .filter(h => h.startsWith('#'));

      return res.status(200).json({ hashtags });
    }

    // Script generation
    if (url === '/api/ai/script' && req.method === 'POST') {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { topic, duration = 30 } = body || {};

      if (!topic) {
        return res.status(400).json({ error: 'Topic je obavezan' });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Napiši skripta za Instagram Reel na srpskom jeziku.
Tema: "${topic}"
Trajanje: ${duration} sekundi
Skripta treba da bude engaging, sa hook-om na početku.
Format: Samo tekst za voiceover, bez oznaka scena.`
        }],
        max_tokens: 500
      });

      return res.status(200).json({ script: completion.choices[0].message.content });
    }

    // Content ideas
    if (url === '/api/ai/ideas' && req.method === 'POST') {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { niche, count = 5 } = body || {};

      if (!niche) {
        return res.status(400).json({ error: 'Niche je obavezan' });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Generiši ${count} ideja za Instagram sadržaj u niši: "${niche}".
Za svaku ideju daj:
1. Naslov/hook
2. Kratak opis (1-2 rečenice)
3. Format (Reel, Post, Story, Carousel)

Vrati kao JSON niz objekata sa poljima: title, description, format`
        }],
        max_tokens: 800
      });

      let ideas;
      try {
        const content = completion.choices[0].message.content;
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        } else {
          ideas = JSON.parse(content);
        }
      } catch (e) {
        ideas = [{ title: completion.choices[0].message.content, description: '', format: 'Post' }];
      }

      return res.status(200).json({ ideas });
    }

    // AI Chat
    if (url === '/api/ai/chat' && req.method === 'POST') {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { message, history = [] } = body || {};

      if (!message) {
        return res.status(400).json({ error: 'Message je obavezan' });
      }

      const messages = [
        {
          role: 'system',
          content: 'Ti si AI asistent za Instagram marketing. Pomaži korisnicima sa strategijom, sadržajem i rastom na Instagramu. Odgovaraj na srpskom jeziku.'
        },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 800
      });

      return res.status(200).json({ response: completion.choices[0].message.content });
    }

    // Default response
    return res.status(200).json({ 
      message: 'Route not configured',
      path: url,
      method: req.method
    });

  } catch (error) {
    console.error('API Error:', error);
    
    // Check for payment required error
    if (error.message?.includes('Payment') || error.message?.includes('402') || error.message?.includes('billing')) {
      return res.status(402).json({ 
        error: 'Potrebna uplata na Replicate nalogu. Posetite replicate.com/account/billing',
        requiresPayment: true
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      path: url
    });
  }
};

/**
 * Helper to update premium job status in MongoDB or in-memory
 */
async function updatePremiumJobStatus(jobId, updates) {
  // Update in-memory
  if (global.premiumJobs && global.premiumJobs[jobId]) {
    Object.assign(global.premiumJobs[jobId], updates);
  }
  
  // Update in MongoDB
  if (isDbConnected && PremiumJob) {
    try {
      await PremiumJob.updateOne({ jobId }, { $set: updates });
    } catch (err) {
      console.error(`[${jobId}] MongoDB update failed:`, err.message);
    }
  }
}

/**
 * Helper to get job from MongoDB or in-memory
 */
async function getPremiumJob(jobId) {
  // Try MongoDB first
  if (isDbConnected && PremiumJob) {
    try {
      const job = await PremiumJob.findOne({ jobId }).lean();
      if (job) return job;
    } catch (err) {
      console.error(`[${jobId}] MongoDB query failed:`, err.message);
    }
  }
  
  // Fallback to in-memory
  if (global.premiumJobs && global.premiumJobs[jobId]) {
    return global.premiumJobs[jobId];
  }
  
  return null;
}

/**
 * Process Premium AI Video Job in Background (Vercel)
 * This runs async after the response is sent
 */
async function processPremiumJobVercel(jobId) {
  const job = await getPremiumJob(jobId);
  if (!job) {
    console.error(`[${jobId}] Job not found for processing`);
    return;
  }

  const { prompt, businessName, industry, contentPurpose, aspectRatio, voice, includeSubtitles, subtitleStyle, logoUrl, logoPosition, logoSize } = job.input;

  try {
    const OpenAI = require('openai');
    const Replicate = require('replicate');
    const fetch = require('node-fetch');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // ============================================
    // STEP 1: GPT scene breakdown
    // ============================================
    await updatePremiumJobStatus(jobId, {
      status: 'generating_script',
      progress: 5,
      statusMessage: '📝 Creating script and scenes...'
    });

    const sceneBreakdownResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert video producer creating scene breakdowns for premium brand videos.

Your task:
1. Create a compelling voiceover script (15-25 seconds when spoken)
2. Break it into exactly 3 visual scenes that SHOW THE PRODUCT BEING USED

CRITICAL - Each scene needs these fields:
- visualPrompt: For AI IMAGE generation - describe the STATIC image with PRODUCT VISIBLE
- motionPrompt: For AI VIDEO animation - describe movement INCLUDING PRODUCT INTERACTION
- productAction: Specifically how the product appears/is used in this scene

**MOST IMPORTANT**: At least ONE scene MUST show a person USING the product:
- If it's a nasal strip → show person applying it to their nose, then breathing freely
- If it's food → show person eating/drinking it with enjoyment
- If it's clothing → show person putting it on or wearing it confidently
- If it's tech → show hands using the device, screen interactions
- If it's skincare → show applying to face, the transformation

VISUAL PROMPT RULES:
- ALWAYS include the actual product in at least 2 scenes
- Show the product being USED by a person, not just displayed
- Describe the person: age, gender, ethnicity for diversity, expression
- Professional lighting, commercial quality aesthetic
- NO text/words/logos

MOTION PROMPT RULES:
- Describe BOTH camera movement AND product/person movement
- "Person applies [product] to [body part], satisfied expression, gentle camera zoom"
- "Hand reaches for [product], picks it up, brings to face, smooth motion"
- Show the product ACTION happening in the animation

OUTPUT FORMAT (JSON only):
{
  "voiceoverScript": "The narration...",
  "productDescription": "Brief description of what the product is and how it's used",
  "scenes": [
    { 
      "sceneNumber": 1, 
      "visualPrompt": "Image with product visible...", 
      "motionPrompt": "Movement including product interaction...",
      "productAction": "How the product is shown/used in this scene"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Create a premium brand video for:

PRODUCT: ${prompt}
${businessName ? `BRAND: ${businessName}` : ''}
${industry ? `INDUSTRY: ${industry}` : ''}
${contentPurpose ? `PURPOSE: ${contentPurpose}` : ''}

IMPORTANT: Show the actual product being USED by people in the scenes. Don't just show abstract lifestyle shots - show the product in action!

Output valid JSON only.`
        }
      ],
      temperature: 0.8
    });

    let sceneBreakdown;
    const jsonMatch = sceneBreakdownResponse.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      sceneBreakdown = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse scene breakdown');
    }

    console.log(`[${jobId}] ✅ Script ready: ${sceneBreakdown.scenes.length} scenes`);
    await updatePremiumJobStatus(jobId, {
      progress: 10,
      voiceoverScript: sceneBreakdown.voiceoverScript
    });

    // ============================================
    // STEP 2: Generate voiceover with ElevenLabs
    // ============================================
    await updatePremiumJobStatus(jobId, {
      statusMessage: '🎙️ Generating voiceover...',
      progress: 15
    });

    const elevenVoiceId = voice || '21m00Tcm4TlvDq8ikWAM'; // Rachel
    const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: sceneBreakdown.voiceoverScript,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!elevenResponse.ok) {
      throw new Error('ElevenLabs voiceover failed');
    }

    // Upload audio to Cloudinary
    const audioBuffer = await elevenResponse.buffer();
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddvtwoyxp',
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const audioUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: 'premium-audio', public_id: `${jobId}-audio` },
        (err, result) => err ? reject(err) : resolve(result)
      ).end(audioBuffer);
    });

    job.audioUrl = audioUpload.secure_url;
    console.log(`[${jobId}] ✅ Voiceover ready`);
    await updatePremiumJobStatus(jobId, {
      audioUrl: audioUpload.secure_url,
      progress: 20
    });

    // ============================================
    // STEP 3: Generate FLUX images
    // ============================================
    const scenesWithImages = [];
    
    for (let i = 0; i < sceneBreakdown.scenes.length; i++) {
      const scene = sceneBreakdown.scenes[i];
      await updatePremiumJobStatus(jobId, {
        statusMessage: `🖼️ Creating image ${i + 1}/${sceneBreakdown.scenes.length}...`,
        progress: 20 + (i * 10)
      });

      const fluxOutput = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt: scene.visualPrompt,
            aspect_ratio: aspectRatio === '9:16' ? '9:16' : (aspectRatio === '16:9' ? '16:9' : '1:1'),
            output_format: 'jpg'
          }
        }
      );

      if (fluxOutput && fluxOutput[0]) {
        // Upload to Cloudinary
        const imgUpload = await cloudinary.uploader.upload(fluxOutput[0], {
          folder: 'premium-scenes',
          public_id: `${jobId}-img-${i}`
        });
        scenesWithImages.push({ ...scene, imageUrl: imgUpload.secure_url });
        console.log(`[${jobId}] ✅ Scene ${i + 1} image ready`);
      }
    }

    if (scenesWithImages.length === 0) {
      throw new Error('No images generated');
    }

    await updatePremiumJobStatus(jobId, { progress: 50 });

    // ============================================
    // STEP 4: Animate with Kling (Brand-Aware Motion)
    // ============================================
    const animatedScenes = [];
    
    for (let i = 0; i < scenesWithImages.length; i++) {
      const scene = scenesWithImages[i];
      await updatePremiumJobStatus(jobId, {
        statusMessage: `🎬 Animating scene ${i + 1}/${scenesWithImages.length}... (60-90s)`,
        progress: 50 + (i * 12)
      });

      // Build product-aware motion prompt for Kling
      // Include: what the product IS, how it's being USED, and the motion
      
      // Get product description from GPT's analysis
      const productDesc = sceneBreakdown.productDescription || prompt;
      const productAction = scene.productAction || '';
      let motionPrompt = scene.motionPrompt || '';
      
      if (!motionPrompt) {
        // Fallback based on industry
        const industryMotions = {
          'E-Commerce': 'Person interacts with product, examining it closely, satisfied expression',
          'Food & Beverage': 'Person enjoys the food/drink, savoring moment, gentle smile',
          'Fashion & Beauty': 'Person applies/wears the product confidently, admiring result',
          'Health & Fitness': 'Person uses the product, feeling the benefit, energized expression',
          'Technology': 'Hands interact with device smoothly, intuitive usage demonstration',
          'Real Estate': 'Person walks through space appreciatively, discovering features',
          'Travel': 'Person experiences destination, wonder and joy in expression',
          'Professional Services': 'Professional interaction, trust and confidence conveyed'
        };
        motionPrompt = industryMotions[industry] || 'Person interacts with product naturally, genuine satisfaction';
      }

      // Build comprehensive Kling prompt with FULL product context
      // This tells Kling WHAT the product is and HOW to show it being used
      const fullMotionPrompt = `PRODUCT: ${productDesc}. ${productAction ? `ACTION: ${productAction}. ` : ''}MOTION: ${motionPrompt}. Professional commercial quality, smooth natural movement.`;

      console.log(`[${jobId}] Scene ${i + 1} motion: ${fullMotionPrompt.substring(0, 80)}...`);

      // Use Kling v2.1 for image-to-video
      const prediction = await replicate.predictions.create({
        model: "kwaivgi/kling-v2.1-5s-i2v",
        input: {
          image: scene.imageUrl,
          prompt: fullMotionPrompt,
          negative_prompt: "blur, distortion, low quality, shaky, amateur, text, watermark",
          cfg_scale: 0.5,
          seed: -1
        }
      });

      // Poll for completion
      let videoUrl = null;
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        const status = await replicate.predictions.get(prediction.id);
        if (status.status === 'succeeded' && status.output) {
          videoUrl = status.output;
          break;
        } else if (status.status === 'failed') {
          console.warn(`[${jobId}] Scene ${i + 1} animation failed`);
          break;
        }
      }

      if (videoUrl) {
        // Upload to Cloudinary
        const vidUpload = await cloudinary.uploader.upload(videoUrl, {
          resource_type: 'video',
          folder: 'premium-scenes',
          public_id: `${jobId}-vid-${i}`
        });
        animatedScenes.push({ ...scene, videoUrl: vidUpload.secure_url, duration: 5 });
        console.log(`[${jobId}] ✅ Scene ${i + 1} animated`);
      }
    }

    if (animatedScenes.length === 0) {
      throw new Error('No scenes animated');
    }

    await updatePremiumJobStatus(jobId, { progress: 85 });

    // ============================================
    // STEP 5: Compose with Shotstack
    // ============================================
    await updatePremiumJobStatus(jobId, {
      statusMessage: '🎥 Composing final video...',
      progress: 90
    });

    // Build subtitles
    const subtitles = [];
    if (includeSubtitles) {
      const words = sceneBreakdown.voiceoverScript.split(/\s+/);
      const wordsPerSub = Math.ceil(words.length / 6);
      const totalDuration = animatedScenes.length * 5;
      const subDuration = totalDuration / Math.ceil(words.length / wordsPerSub);
      let t = 0;
      for (let i = 0; i < words.length; i += wordsPerSub) {
        subtitles.push({ text: words.slice(i, i + wordsPerSub).join(' '), start: t, end: t + subDuration });
        t += subDuration;
      }
    }

    // Build Shotstack timeline
    const clips = animatedScenes.map((s, idx) => ({
      asset: { type: 'video', src: s.videoUrl, volume: 0 },
      start: idx * 5,
      length: 5
    }));

    const timeline = {
      background: '#000000',
      tracks: [
        { clips: clips }
      ],
      soundtrack: {
        src: job.audioUrl,
        effect: 'fadeOut'
      }
    };

    // Add logo if provided
    if (logoUrl) {
      const logoClip = {
        asset: { type: 'image', src: logoUrl },
        start: 0,
        length: animatedScenes.length * 5,
        position: logoPosition,
        scale: logoSize
      };
      timeline.tracks.unshift({ clips: [logoClip] });
    }

    // Add subtitles track
    if (subtitles.length > 0) {
      const subClips = subtitles.map(sub => ({
        asset: {
          type: 'title',
          text: sub.text.toUpperCase(),
          style: 'chunk',
          size: 'medium',
          color: '#ffffff',
          background: '#000000aa'
        },
        start: sub.start,
        length: sub.end - sub.start,
        position: 'bottom',
        offset: { y: 0.1 }
      }));
      timeline.tracks.push({ clips: subClips });
    }

    const shotstackPayload = {
      timeline,
      output: {
        format: 'mp4',
        resolution: aspectRatio === '9:16' ? 'mobile' : 'hd',
        aspectRatio: aspectRatio
      }
    };

    const shotstackResponse = await fetch('https://api.shotstack.io/v1/render', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.SHOTSTACK_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shotstackPayload)
    });

    const shotstackData = await shotstackResponse.json();
    
    if (!shotstackData.success || !shotstackData.response?.id) {
      throw new Error('Shotstack render failed to start');
    }

    const renderId = shotstackData.response.id;
    console.log(`[${jobId}] ✅ Shotstack render started: ${renderId}`);

    // Poll for render completion
    let finalVideoUrl = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise(r => setTimeout(r, 5000));
      await updatePremiumJobStatus(jobId, { progress: 90 + Math.min(9, attempt) });
      
      const statusRes = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
        headers: { 'x-api-key': process.env.SHOTSTACK_API_KEY }
      });
      const statusData = await statusRes.json();
      
      if (statusData.response?.status === 'done' && statusData.response?.url) {
        // Upload to Cloudinary for permanent storage
        const finalUpload = await cloudinary.uploader.upload(statusData.response.url, {
          resource_type: 'video',
          folder: 'premium-final',
          public_id: `${jobId}-final`
        });
        finalVideoUrl = finalUpload.secure_url;
        break;
      } else if (statusData.response?.status === 'failed') {
        throw new Error('Shotstack render failed');
      }
    }

    if (!finalVideoUrl) {
      throw new Error('Render timed out');
    }

    // ============================================
    // DONE!
    // ============================================
    await updatePremiumJobStatus(jobId, {
      status: 'done',
      progress: 100,
      statusMessage: '✅ Video ready!',
      videoUrl: finalVideoUrl
    });

    console.log(`[${jobId}] 🎉 Premium video complete: ${finalVideoUrl}`);

  } catch (error) {
    console.error(`[${jobId}] ❌ Failed:`, error.message);
    await updatePremiumJobStatus(jobId, {
      status: 'failed',
      error: error.message,
      statusMessage: `❌ Failed: ${error.message}`
    });
  }
}
