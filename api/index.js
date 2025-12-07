// Vercel Serverless API Handler with AI Integration

// MongoDB connection for persistent job storage
const mongoose = require('mongoose');
const fetch = require('node-fetch');
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
  // Step-based processing state (for Vercel chunked execution)
  currentStep: { type: String, default: 'script' }, // script, voiceover, classify, images, animate, compose, done
  sceneBreakdown: mongoose.Schema.Types.Mixed, // GPT script result
  classifiedImages: mongoose.Schema.Types.Mixed, // Image classification result
  scenesWithImages: [mongoose.Schema.Types.Mixed], // Scenes with their images
  animatedScenes: [mongoose.Schema.Types.Mixed], // Completed scene animations  
  currentSceneIndex: { type: Number, default: 0 }, // Track progress through scenes
  pendingPrediction: mongoose.Schema.Types.Mixed, // { predictionId, sceneIndex } for Kling polling
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
        logoSize = 0.12,
        // Brand/product images for accurate product representation
        brandImages = [],
        productImages = [],
        // User pre-classified images (skip GPT Vision for these)
        userClassifiedProducts = [],
        userClassifiedLifestyle = [],
        productName = '',
        productDescription = ''
      } = body || {};

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Generate unique job ID
      const jobId = `premium-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`\n🎬 [${jobId}] Starting Premium AI Video Job`);
      console.log(`[${jobId}] 📦 Brand images: ${brandImages.length}, Product images: ${productImages.length}`);
      console.log(`[${jobId}] 🏷️ User pre-classified: ${userClassifiedProducts.length} products, ${userClassifiedLifestyle.length} lifestyle`);

      const jobData = {
        jobId: jobId,
        status: 'pending',
        progress: 0,
        statusMessage: 'Starting...',
        createdAt: new Date(),
        input: { 
          prompt, businessName, industry, contentPurpose, aspectRatio, voice, 
          includeSubtitles, subtitleStyle, logoUrl, logoPosition, logoSize,
          brandImages, productImages, userClassifiedProducts, userClassifiedLifestyle,
          productName, productDescription
        }
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

      // Update status to show we're starting
      await updatePremiumJobStatus(jobId, {
        status: 'pending',
        progress: 1,
        statusMessage: '🚀 Job created, waiting for processing to start...'
      });

      // Return job ID - client will call /process endpoint to start actual processing
      return res.status(200).json({
        success: true,
        jobId: jobId,
        status: 'pending',
        message: 'Premium video job created. Call /api/ai/video/premium-process to start processing.'
      });
    }

    // Process Premium Job - CHUNKED PROCESSING for Vercel
    // Each call processes ONE STEP and returns within Vercel's timeout
    // Client must call repeatedly until job is complete
    if (url === '/api/ai/video/premium-process' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { jobId } = body || {};

      if (!jobId) {
        return res.status(400).json({ error: 'jobId is required' });
      }

      // Get job from MongoDB
      const job = await getPremiumJob(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // If job is already done or failed, return current status
      if (job.status === 'done' || job.status === 'failed') {
        return res.status(200).json({
          success: true,
          jobId: job.jobId,
          status: job.status,
          progress: job.progress,
          statusMessage: job.statusMessage,
          videoUrl: job.videoUrl,
          audioUrl: job.audioUrl,
          voiceoverScript: job.voiceoverScript,
          error: job.error
        });
      }

      const currentStep = job.currentStep || 'script';
      console.log(`[${jobId}] 🔄 Processing step: ${currentStep}`);

      try {
        // Process ONE step at a time - each step saves state and returns
        const result = await processOneStep(jobId, job);
        
        return res.status(200).json({
          success: true,
          jobId: job.jobId,
          status: result.status,
          progress: result.progress,
          statusMessage: result.statusMessage,
          currentStep: result.currentStep,
          videoUrl: result.videoUrl,
          audioUrl: result.audioUrl,
          voiceoverScript: result.voiceoverScript,
          error: result.error,
          needsMoreProcessing: result.status === 'processing'
        });
      } catch (error) {
        console.error(`[${jobId}] Step ${currentStep} failed:`, error.message);
        await updatePremiumJobStatus(jobId, {
          status: 'failed',
          error: error.message,
          statusMessage: `❌ Failed at ${currentStep}: ${error.message}`
        });
        return res.status(200).json({
          success: false,
          jobId: jobId,
          status: 'failed',
          error: error.message,
          statusMessage: `❌ Failed: ${error.message}`
        });
      }
    }

    // Poll Premium Job Status (from MongoDB or in-memory)
    // With continueProcessing=true, also triggers the next processing step
    if (url === '/api/ai/video/premium-job-status' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { jobId, continueProcessing } = body || {};

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

      // If continueProcessing is true and job is still in progress, process one step
      // Note: job.status can be 'pending', 'processing', or other states
      if (continueProcessing && job.status !== 'done' && job.status !== 'failed' && job.progress < 100) {
        console.log(`[${jobId}] 🔄 Status poll with continueProcessing, step: ${job.currentStep || 'script'}`);
        
        try {
          const result = await processOneStep(jobId, job);
          return res.status(200).json({
            success: true,
            jobId: job.jobId,
            status: result.status,
            progress: result.progress,
            statusMessage: result.statusMessage,
            currentStep: result.currentStep,
            videoUrl: result.videoUrl,
            audioUrl: result.audioUrl,
            voiceoverScript: result.voiceoverScript,
            error: result.error,
            needsMoreProcessing: result.status === 'processing'
          });
        } catch (error) {
          console.error(`[${jobId}] Processing continuation failed:`, error.message);
          await updatePremiumJobStatus(jobId, {
            status: 'failed',
            error: error.message,
            statusMessage: `❌ Failed: ${error.message}`
          });
          return res.status(200).json({
            success: false,
            jobId: jobId,
            status: 'failed',
            error: error.message
          });
        }
      }

      return res.status(200).json({
        success: true,
        jobId: job.jobId,
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

    // ==================== ELEVENLABS ENDPOINTS ====================
    
    // ElevenLabs status check
    if (url === '/api/ai/elevenlabs/status' && req.method === 'GET') {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      console.log('🎙️ ElevenLabs status check - API key exists:', !!apiKey);
      
      if (!apiKey) {
        console.log('❌ ELEVENLABS_API_KEY not found in environment');
        return res.status(200).json({ 
          available: false, 
          message: 'ElevenLabs API key not configured' 
        });
      }
      
      try {
        // Check subscription status
        const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
          headers: { 'xi-api-key': apiKey }
        });
        
        console.log('🎙️ ElevenLabs API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ ElevenLabs available - tier:', data.tier);
          return res.status(200).json({
            available: true,
            subscription: {
              tier: data.tier,
              characterCount: data.character_count,
              characterLimit: data.character_limit,
              voiceLimit: data.voice_limit
            }
          });
        } else {
          const errorText = await response.text();
          console.log('❌ ElevenLabs API error:', response.status, errorText);
          return res.status(200).json({ 
            available: false, 
            message: 'Invalid API key or subscription issue' 
          });
        }
      } catch (err) {
        console.error('❌ ElevenLabs fetch error:', err.message);
        return res.status(200).json({ 
          available: false, 
          message: err.message 
        });
      }
    }
    
    // ElevenLabs recommended voices
    if (url === '/api/ai/elevenlabs/voices/recommended' && req.method === 'GET') {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!apiKey) {
        return res.status(200).json({ success: true, voices: [] });
      }
      
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': apiKey }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Map and filter for recommended voices
          const voices = data.voices
            .filter(v => v.labels?.use_case === 'narration' || v.labels?.use_case === 'social_media' || !v.labels?.use_case)
            .slice(0, 12)
            .map(v => ({
              id: v.voice_id,
              name: v.name,
              preview_url: v.preview_url,
              previewUrl: v.preview_url,
              labels: v.labels,
              category: v.category,
              style: v.labels?.description || 'conversational',
              description: v.labels?.description || `${v.labels?.gender || ''} ${v.labels?.accent || ''} voice`.trim(),
              emoji: v.labels?.gender === 'female' ? '👩' : '👨'
            }));
          
          return res.status(200).json({ success: true, voices });
        } else {
          // Return default voices as fallback
          return res.status(200).json({ 
            success: true,
            voices: [
              { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', style: 'conversational', emoji: '👩', description: 'Warm female voice', labels: { accent: 'american', gender: 'female' } },
              { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', style: 'energetic', emoji: '👩', description: 'Energetic female voice', labels: { accent: 'american', gender: 'female' } },
              { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', style: 'soft', emoji: '👩', description: 'Soft female voice', labels: { accent: 'american', gender: 'female' } },
              { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', style: 'professional', emoji: '👨', description: 'Professional male voice', labels: { accent: 'american', gender: 'male' } },
              { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', style: 'youthful', emoji: '👧', description: 'Youthful female voice', labels: { accent: 'american', gender: 'female' } },
              { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', style: 'dynamic', emoji: '👨', description: 'Dynamic male voice', labels: { accent: 'american', gender: 'male' } },
              { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', style: 'narrator', emoji: '👨', description: 'Narrator male voice', labels: { accent: 'american', gender: 'male' } },
              { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', style: 'deep', emoji: '👨', description: 'Deep male voice', labels: { accent: 'american', gender: 'male' } }
            ]
          });
        }
      } catch (err) {
        console.error('ElevenLabs voices error:', err);
        return res.status(200).json({ success: true, voices: [] });
      }
    }

    // ElevenLabs Full Voiceover (script generation + TTS)
    if (url === '/api/ai/elevenlabs/full-voiceover' && req.method === 'POST') {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'ElevenLabs API key not configured' });
      }
      
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { topic, duration = 15, voiceId = '21m00Tcm4TlvDq8ikWAM', voiceStyle = 'engaging' } = body || {};
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }
      
      try {
        // Step 1: Generate script with OpenAI
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: openaiKey });
        
        const scriptResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert Instagram content writer. Create a voiceover script for a ${duration} second video.
              
Rules:
- Write for spoken word (conversational, not written style)
- ${duration} seconds = approximately ${Math.round(duration * 2.5)} words
- Start with a hook that grabs attention
- Be ${voiceStyle} in tone
- End with a call to action
- NO stage directions, NO emojis, NO hashtags
- Just the spoken text, nothing else

Output ONLY the script text, nothing else.`
            },
            { role: 'user', content: `Create a voiceover script about: ${topic}` }
          ],
          max_tokens: 300,
          temperature: 0.8
        });
        
        const script = scriptResponse.choices[0].message.content.trim();
        console.log('📝 Generated script:', script.substring(0, 100) + '...');
        
        // Step 2: Generate audio with ElevenLabs
        const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: script,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        });
        
        if (!elevenResponse.ok) {
          const errorText = await elevenResponse.text();
          console.error('ElevenLabs TTS failed:', errorText);
          throw new Error('ElevenLabs TTS failed');
        }
        
        // Upload audio to Cloudinary
        const audioBuffer = await elevenResponse.buffer();
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        const audioUpload = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'video', folder: 'voiceovers', public_id: `vo-${Date.now()}` },
            (err, result) => err ? reject(err) : resolve(result)
          ).end(audioBuffer);
        });
        
        console.log('✅ ElevenLabs voiceover uploaded:', audioUpload.secure_url);
        
        return res.status(200).json({
          success: true,
          script: script,
          audioUrl: audioUpload.secure_url,
          duration: audioUpload.duration || duration,
          voiceId: voiceId
        });
        
      } catch (err) {
        console.error('ElevenLabs full-voiceover error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    // ElevenLabs TTS (text to speech only, no script generation)
    if (url === '/api/ai/elevenlabs/tts' && req.method === 'POST') {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'ElevenLabs API key not configured' });
      }
      
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = body || {};
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      try {
        const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        });
        
        if (!elevenResponse.ok) {
          throw new Error('ElevenLabs TTS failed');
        }
        
        // Upload to Cloudinary
        const audioBuffer = await elevenResponse.buffer();
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        const audioUpload = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'video', folder: 'voiceovers', public_id: `tts-${Date.now()}` },
            (err, result) => err ? reject(err) : resolve(result)
          ).end(audioBuffer);
        });
        
        return res.status(200).json({
          success: true,
          audioUrl: audioUpload.secure_url,
          duration: audioUpload.duration
        });
        
      } catch (err) {
        console.error('ElevenLabs TTS error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    // ==================== MEDIA UPLOAD (Cloudinary) ====================
    
    // Image upload endpoint for brand images
    if (url === '/api/media/upload/image' && req.method === 'POST') {
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      // Handle multipart form data
      const busboy = require('busboy');
      
      return new Promise((resolve, reject) => {
        const bb = busboy({ headers: req.headers });
        let fileBuffer = null;
        let folder = 'brand-images';
        
        bb.on('file', (name, file, info) => {
          const chunks = [];
          file.on('data', (chunk) => chunks.push(chunk));
          file.on('end', () => {
            fileBuffer = Buffer.concat(chunks);
          });
        });
        
        bb.on('field', (name, val) => {
          if (name === 'folder') folder = val;
        });
        
        bb.on('finish', async () => {
          if (!fileBuffer) {
            res.status(400).json({ error: 'No file uploaded' });
            return resolve();
          }
          
          try {
            // Upload to Cloudinary using buffer
            const uploadResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: folder, resource_type: 'image' },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(fileBuffer);
            });
            
            res.status(200).json({
              success: true,
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id
            });
            resolve();
          } catch (uploadErr) {
            console.error('Cloudinary upload error:', uploadErr);
            res.status(500).json({ error: 'Upload failed: ' + uploadErr.message });
            resolve();
          }
        });
        
        bb.on('error', (err) => {
          console.error('Busboy error:', err);
          res.status(500).json({ error: 'Upload parsing failed' });
          resolve();
        });
        
        req.pipe(bb);
      });
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
 * CHUNKED PROCESSING: Process ONE step at a time
 * Each step runs within Vercel's timeout, saves state, and returns
 * Client calls again to process the next step
 * 
 * Steps: script → voiceover → classify → images → animate → compose → done
 */
async function processOneStep(jobId, job) {
  const currentStep = job.currentStep || 'script';
  
  const OpenAI = require('openai');
  const Replicate = require('replicate');
  const fetch = require('node-fetch');
  const cloudinary = require('cloudinary').v2;
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddvtwoyxp',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const { 
    prompt, businessName, industry, contentPurpose, aspectRatio, voice, 
    includeSubtitles, subtitleStyle, logoUrl, logoPosition, logoSize,
    brandImages = [], productImages = [], 
    userClassifiedProducts = [], userClassifiedLifestyle = [],
    productName = '', productDescription = ''
  } = job.input;

  const availableProductImages = [...productImages, ...brandImages].filter(Boolean);

  // ============================================
  // STEP: SCRIPT - Generate voiceover script with GPT
  // ============================================
  if (currentStep === 'script') {
    console.log(`[${jobId}] 📝 Step: SCRIPT`);
    await updatePremiumJobStatus(jobId, {
      status: 'processing',
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

**MOST IMPORTANT**: At least ONE scene MUST show a person USING the product.

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
      voiceoverScript: sceneBreakdown.voiceoverScript,
      sceneBreakdown: sceneBreakdown,
      currentStep: 'voiceover',
      statusMessage: '🎙️ Generating voiceover...'
    });

    const updatedJob = await getPremiumJob(jobId);
    return { ...updatedJob, currentStep: 'voiceover' };
  }

  // ============================================
  // STEP: VOICEOVER - Generate with ElevenLabs
  // ============================================
  if (currentStep === 'voiceover') {
    console.log(`[${jobId}] 🎙️ Step: VOICEOVER`);
    await updatePremiumJobStatus(jobId, {
      progress: 15,
      statusMessage: '🎙️ Generating voiceover...'
    });

    const sceneBreakdown = job.sceneBreakdown;
    if (!sceneBreakdown || !sceneBreakdown.voiceoverScript) {
      throw new Error('No script found - restart processing');
    }

    const elevenVoiceId = voice || '21m00Tcm4TlvDq8ikWAM';
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

    const audioBuffer = await elevenResponse.buffer();
    const audioUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: 'premium-audio', public_id: `${jobId}-audio` },
        (err, result) => err ? reject(err) : resolve(result)
      ).end(audioBuffer);
    });

    console.log(`[${jobId}] ✅ Voiceover ready`);
    
    await updatePremiumJobStatus(jobId, {
      audioUrl: audioUpload.secure_url,
      progress: 20,
      currentStep: 'classify',
      statusMessage: '🔍 Analyzing images...'
    });

    const updatedJob = await getPremiumJob(jobId);
    return { ...updatedJob, currentStep: 'classify' };
  }

  // ============================================
  // STEP: CLASSIFY - Classify brand images
  // ============================================
  if (currentStep === 'classify') {
    console.log(`[${jobId}] 🔍 Step: CLASSIFY`);
    await updatePremiumJobStatus(jobId, {
      progress: 22,
      statusMessage: '🔍 Analyzing images...'
    });

    let classifiedImages = {
      productShots: [],
      lifestyleShots: [],
      logoImages: [],
      otherImages: []
    };

    // Add user pre-classified images
    if (userClassifiedProducts.length > 0) {
      classifiedImages.productShots = userClassifiedProducts.map(url => ({ url, description: 'user-classified product' }));
    }
    if (userClassifiedLifestyle.length > 0) {
      classifiedImages.lifestyleShots = userClassifiedLifestyle.map(url => ({ url, description: 'user-classified lifestyle' }));
    }

    // Find images that need classification
    const alreadyClassified = new Set([...userClassifiedProducts, ...userClassifiedLifestyle]);
    const needsClassification = availableProductImages.filter(url => !alreadyClassified.has(url));

    if (needsClassification.length > 0) {
      try {
        const visionResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `Classify these ${needsClassification.length} images as: product, lifestyle, logo, or other. Product: ${prompt}. Return JSON array: [{"index": 0, "type": "product", "description": "..."}]` },
              ...needsClassification.slice(0, 6).map(url => ({
                type: 'image_url',
                image_url: { url, detail: 'low' }
              }))
            ]
          }],
          max_tokens: 500
        });

        const classificationResult = visionResponse.choices[0].message.content;
        const jsonMatch = classificationResult.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          const classifications = JSON.parse(jsonMatch[0]);
          classifications.forEach(({ index, type, description }) => {
            if (index < needsClassification.length) {
              const imgData = { url: needsClassification[index], description };
              switch (type) {
                case 'product': classifiedImages.productShots.push(imgData); break;
                case 'lifestyle': classifiedImages.lifestyleShots.push(imgData); break;
                case 'logo': classifiedImages.logoImages.push(imgData); break;
                default: classifiedImages.otherImages.push(imgData);
              }
            }
          });
        }
      } catch (classifyErr) {
        console.warn(`[${jobId}] Classification failed, treating as product shots`);
        needsClassification.forEach(url => {
          classifiedImages.productShots.push({ url, description: 'auto-fallback' });
        });
      }
    }

    console.log(`[${jobId}] ✅ Classified: ${classifiedImages.productShots.length} product, ${classifiedImages.lifestyleShots.length} lifestyle`);
    
    await updatePremiumJobStatus(jobId, {
      classifiedImages: classifiedImages,
      progress: 25,
      currentStep: 'images',
      currentSceneIndex: 0,
      scenesWithImages: [],
      statusMessage: '🖼️ Preparing scene images...'
    });

    const updatedJob = await getPremiumJob(jobId);
    return { ...updatedJob, currentStep: 'images' };
  }

  // ============================================
  // STEP: IMAGES - Prepare scene images (one at a time)
  // ============================================
  if (currentStep === 'images') {
    const sceneBreakdown = job.sceneBreakdown;
    const classifiedImages = job.classifiedImages || { productShots: [], lifestyleShots: [], logoImages: [], otherImages: [] };
    const scenesWithImages = job.scenesWithImages || [];
    const currentSceneIndex = job.currentSceneIndex || 0;
    
    if (currentSceneIndex >= sceneBreakdown.scenes.length) {
      // All images done, move to animation
      console.log(`[${jobId}] ✅ All scene images ready`);
      await updatePremiumJobStatus(jobId, {
        progress: 50,
        currentStep: 'animate',
        currentSceneIndex: 0,
        animatedScenes: [],
        statusMessage: '🎬 Starting animation...'
      });
      const updatedJob = await getPremiumJob(jobId);
      return { ...updatedJob, currentStep: 'animate' };
    }

    const i = currentSceneIndex;
    const scene = sceneBreakdown.scenes[i];
    console.log(`[${jobId}] 🖼️ Step: IMAGE ${i + 1}/${sceneBreakdown.scenes.length}`);
    
    await updatePremiumJobStatus(jobId, {
      progress: 25 + (i * 8),
      statusMessage: `🖼️ Preparing image ${i + 1}/${sceneBreakdown.scenes.length}...`
    });

    const hasClassifiedImages = classifiedImages.productShots.length > 0 || classifiedImages.lifestyleShots.length > 0;
    let imageUrl = null;
    let imageType = 'generated';

    if (hasClassifiedImages) {
      const sceneText = `${scene.visualPrompt} ${scene.productAction || ''} ${scene.motionPrompt || ''}`.toLowerCase();
      const needsLifestyle = sceneText.includes('person') || sceneText.includes('using');
      
      let selectedImage = null;
      if (needsLifestyle && classifiedImages.lifestyleShots.length > 0) {
        selectedImage = classifiedImages.lifestyleShots[i % classifiedImages.lifestyleShots.length];
        imageType = 'lifestyle';
      } else if (classifiedImages.productShots.length > 0) {
        selectedImage = classifiedImages.productShots[i % classifiedImages.productShots.length];
        imageType = 'product';
      } else if (classifiedImages.lifestyleShots.length > 0) {
        selectedImage = classifiedImages.lifestyleShots[i % classifiedImages.lifestyleShots.length];
        imageType = 'lifestyle';
      }

      if (selectedImage) {
        if (selectedImage.url.includes('cloudinary')) {
          imageUrl = selectedImage.url;
        } else {
          try {
            const imgUpload = await cloudinary.uploader.upload(selectedImage.url, {
              folder: 'premium-scenes',
              public_id: `${jobId}-img-${i}`
            });
            imageUrl = imgUpload.secure_url;
          } catch (uploadErr) {
            console.warn(`[${jobId}] Failed to upload, falling back to FLUX`);
          }
        }
      }
    }

    // Generate with FLUX if no product image
    if (!imageUrl) {
      imageType = 'generated';
      const fluxOutput = await replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: scene.visualPrompt,
          aspect_ratio: aspectRatio === '9:16' ? '9:16' : (aspectRatio === '16:9' ? '16:9' : '1:1'),
          output_format: 'jpg'
        }
      });

      if (fluxOutput && fluxOutput[0]) {
        const imgUpload = await cloudinary.uploader.upload(fluxOutput[0], {
          folder: 'premium-scenes',
          public_id: `${jobId}-img-${i}`
        });
        imageUrl = imgUpload.secure_url;
      }
    }

    if (imageUrl) {
      scenesWithImages.push({ ...scene, imageUrl, imageType, usedProductImage: imageType !== 'generated' });
      console.log(`[${jobId}] ✅ Scene ${i + 1} image ready (${imageType})`);
    }

    await updatePremiumJobStatus(jobId, {
      scenesWithImages: scenesWithImages,
      currentSceneIndex: currentSceneIndex + 1,
      progress: 25 + ((i + 1) * 8)
    });

    const updatedJob = await getPremiumJob(jobId);
    return { ...updatedJob, currentStep: 'images' };
  }

  // ============================================
  // STEP: ANIMATE - Animate scenes with Kling (one at a time, with polling)
  // ============================================
  if (currentStep === 'animate') {
    const scenesWithImages = job.scenesWithImages || [];
    const animatedScenes = job.animatedScenes || [];
    const currentSceneIndex = job.currentSceneIndex || 0;
    const pendingPrediction = job.pendingPrediction;

    // If there's a pending Kling prediction, check its status
    if (pendingPrediction && pendingPrediction.predictionId) {
      console.log(`[${jobId}] 🔄 Checking Kling prediction ${pendingPrediction.predictionId}`);
      
      const status = await replicate.predictions.get(pendingPrediction.predictionId);
      
      if (status.status === 'succeeded' && status.output) {
        // Upload to Cloudinary
        const scene = scenesWithImages[pendingPrediction.sceneIndex];
        const vidUpload = await cloudinary.uploader.upload(status.output, {
          resource_type: 'video',
          folder: 'premium-scenes',
          public_id: `${jobId}-vid-${pendingPrediction.sceneIndex}`
        });
        
        animatedScenes.push({ ...scene, videoUrl: vidUpload.secure_url, duration: 5 });
        console.log(`[${jobId}] ✅ Scene ${pendingPrediction.sceneIndex + 1} animated`);
        
        await updatePremiumJobStatus(jobId, {
          animatedScenes: animatedScenes,
          currentSceneIndex: pendingPrediction.sceneIndex + 1,
          pendingPrediction: null,
          progress: 50 + ((pendingPrediction.sceneIndex + 1) * 12)
        });
        
        const updatedJob = await getPremiumJob(jobId);
        return { ...updatedJob, currentStep: 'animate' };
      } else if (status.status === 'failed') {
        console.warn(`[${jobId}] Scene ${pendingPrediction.sceneIndex + 1} animation failed`);
        // Skip this scene and continue
        await updatePremiumJobStatus(jobId, {
          currentSceneIndex: pendingPrediction.sceneIndex + 1,
          pendingPrediction: null
        });
        const updatedJob = await getPremiumJob(jobId);
        return { ...updatedJob, currentStep: 'animate' };
      } else {
        // Still processing - return current status, client will poll again
        console.log(`[${jobId}] ⏳ Kling still processing scene ${pendingPrediction.sceneIndex + 1}...`);
        await updatePremiumJobStatus(jobId, {
          statusMessage: `🎬 Animating scene ${pendingPrediction.sceneIndex + 1}/${scenesWithImages.length}... (please wait)`
        });
        const updatedJob = await getPremiumJob(jobId);
        return { ...updatedJob, currentStep: 'animate' };
      }
    }

    // Check if all scenes are done
    if (currentSceneIndex >= scenesWithImages.length) {
      if (animatedScenes.length === 0) {
        throw new Error('No scenes animated - all scenes failed');
      }
      console.log(`[${jobId}] ✅ All scenes animated (${animatedScenes.length}/${scenesWithImages.length})`);
      await updatePremiumJobStatus(jobId, {
        progress: 85,
        currentStep: 'compose',
        statusMessage: '🎥 Composing final video...'
      });
      const updatedJob = await getPremiumJob(jobId);
      return { ...updatedJob, currentStep: 'compose' };
    }

    // Start animating the next scene
    const i = currentSceneIndex;
    const scene = scenesWithImages[i];
    console.log(`[${jobId}] 🎬 Step: ANIMATE scene ${i + 1}/${scenesWithImages.length}`);
    
    await updatePremiumJobStatus(jobId, {
      statusMessage: `🎬 Starting animation ${i + 1}/${scenesWithImages.length}...`,
      progress: 50 + (i * 12)
    });

    // Build motion prompt
    const productDesc = productDescription || job.sceneBreakdown?.productDescription || prompt;
    let motionPrompt = scene.motionPrompt || 'Person interacts with product naturally';
    let cfgScale = scene.imageType === 'product' ? 0.1 : (scene.imageType === 'lifestyle' ? 0.2 : 0.4);
    
    const fullMotionPrompt = scene.imageType === 'lifestyle'
      ? `The person continues natural interaction. ${motionPrompt}. Keep product unchanged. Commercial quality.`
      : scene.imageType === 'product'
      ? `Product showcase. Very subtle animation: gentle lighting or soft camera movement around unchanged product.`
      : `PRODUCT: ${productDesc}. ${motionPrompt}. Professional commercial quality.`;

    // Create Kling prediction
    const prediction = await replicate.predictions.create({
      model: "kwaivgi/kling-v2.1",
      input: {
        prompt: fullMotionPrompt,
        start_image: scene.imageUrl,
        duration: 5,
        aspect_ratio: aspectRatio || '9:16',
        negative_prompt: 'blur, distortion, low quality, change product, morph product',
        cfg_scale: cfgScale
      }
    });

    console.log(`[${jobId}] 🎬 Kling prediction started: ${prediction.id}`);
    
    // Save prediction ID and return - client will poll again
    await updatePremiumJobStatus(jobId, {
      pendingPrediction: { predictionId: prediction.id, sceneIndex: i },
      statusMessage: `🎬 Animating scene ${i + 1}/${scenesWithImages.length}... (60-90s)`
    });

    const updatedJob = await getPremiumJob(jobId);
    return { ...updatedJob, currentStep: 'animate' };
  }

  // ============================================
  // STEP: COMPOSE - Final video composition with Shotstack
  // ============================================
  if (currentStep === 'compose') {
    console.log(`[${jobId}] 🎥 Step: COMPOSE`);
    const animatedScenes = job.animatedScenes || [];
    const sceneBreakdown = job.sceneBreakdown;
    const classifiedImages = job.classifiedImages || {};
    
    if (animatedScenes.length === 0) {
      throw new Error('No animated scenes available for composition');
    }

    await updatePremiumJobStatus(jobId, {
      progress: 90,
      statusMessage: '🎥 Composing final video...'
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
      tracks: [{ clips }],
      soundtrack: { src: job.audioUrl, effect: 'fadeOut' }
    };

    // Add logo if available
    const actualLogoUrl = classifiedImages.logoImages?.length > 0 
      ? classifiedImages.logoImages[0].url 
      : logoUrl;
    
    if (actualLogoUrl) {
      const logoClip = {
        asset: { type: 'image', src: actualLogoUrl },
        start: 0,
        length: animatedScenes.length * 5,
        position: 'topRight',
        offset: { x: -0.03, y: 0.03 },
        scale: Math.min(logoSize || 0.1, 0.15),
        opacity: 0.9
      };
      timeline.tracks.unshift({ clips: [logoClip] });
    }

    // Add subtitles
    if (subtitles.length > 0) {
      const subClips = subtitles.map(sub => ({
        asset: {
          type: 'title',
          text: sub.text.toUpperCase(),
          style: 'chunk',
          size: 'small',
          color: '#ffffff',
          background: '#000000cc'
        },
        start: sub.start,
        length: sub.end - sub.start,
        position: 'bottom',
        offset: { y: -0.08 }
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
    
    // Save render ID and move to polling step
    await updatePremiumJobStatus(jobId, {
      pendingPrediction: { renderId: renderId },
      currentStep: 'compose_poll',
      statusMessage: '🎥 Rendering final video...'
    });

    const updatedJob = await getPremiumJob(jobId);
    return { ...updatedJob, currentStep: 'compose_poll' };
  }

  // ============================================
  // STEP: COMPOSE_POLL - Poll Shotstack render status
  // ============================================
  if (currentStep === 'compose_poll') {
    const pendingPrediction = job.pendingPrediction;
    
    if (!pendingPrediction || !pendingPrediction.renderId) {
      throw new Error('No render ID found');
    }

    console.log(`[${jobId}] 🔄 Checking Shotstack render ${pendingPrediction.renderId}`);
    
    const statusRes = await fetch(`https://api.shotstack.io/v1/render/${pendingPrediction.renderId}`, {
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
      
      console.log(`[${jobId}] 🎉 Premium video complete: ${finalUpload.secure_url}`);
      
      await updatePremiumJobStatus(jobId, {
        status: 'done',
        progress: 100,
        statusMessage: '✅ Video ready!',
        videoUrl: finalUpload.secure_url,
        pendingPrediction: null,
        currentStep: 'done',
        completedAt: new Date()
      });

      const updatedJob = await getPremiumJob(jobId);
      return { ...updatedJob, status: 'done', currentStep: 'done' };
    } else if (statusData.response?.status === 'failed') {
      throw new Error('Shotstack render failed');
    } else {
      // Still rendering
      console.log(`[${jobId}] ⏳ Shotstack still rendering...`);
      await updatePremiumJobStatus(jobId, {
        progress: 92,
        statusMessage: '🎥 Rendering final video... (please wait)'
      });
      const updatedJob = await getPremiumJob(jobId);
      return { ...updatedJob, currentStep: 'compose_poll' };
    }
  }

  // If we get here with 'done' status, return the job
  if (currentStep === 'done' || job.status === 'done') {
    return job;
  }

  throw new Error(`Unknown step: ${currentStep}`);
}

/**
 * Process Premium AI Video Job in Background (Vercel)
 * DEPRECATED - Use processOneStep instead for chunked processing
 * Keeping for reference/fallback
 */
async function processPremiumJobVercel(jobId) {
  console.log(`[${jobId}] ⚠️ processPremiumJobVercel called - this is deprecated, use chunked processing`);
  // Just call processOneStep once and return
  const job = await getPremiumJob(jobId);
  if (job) {
    await processOneStep(jobId, job);
  }
}
