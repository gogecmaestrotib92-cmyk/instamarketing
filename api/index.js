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
        status: 'starting',
        progress: 1,
        statusMessage: '🚀 Job received, starting processing...'
      });

      // On Vercel, we can't use true background processing
      // The function will keep running until timeout (configured in vercel.json)
      // Use waitUntil pattern if available, otherwise just don't await
      
      // Start processing - this will continue after response
      // Note: On Vercel Pro, maxDuration can be up to 300s
      const processPromise = processPremiumJobVercel(jobId).catch(err => {
        console.error(`[${jobId}] Background process error:`, err.message);
        updatePremiumJobStatus(jobId, { status: 'failed', error: err.message });
      });

      // If waitUntil is available (Vercel Edge), use it to keep function alive
      if (res.waitUntil) {
        res.waitUntil(processPromise);
      }

      // Return immediately - processing continues in background
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

    // ==================== ELEVENLABS ENDPOINTS ====================
    
    // ElevenLabs status check
    if (url === '/api/ai/elevenlabs/status' && req.method === 'GET') {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!apiKey) {
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
        
        if (response.ok) {
          const data = await response.json();
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
          return res.status(200).json({ 
            available: false, 
            message: 'Invalid API key or subscription issue' 
          });
        }
      } catch (err) {
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
        return res.status(200).json({ voices: [] });
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
              labels: v.labels,
              category: v.category
            }));
          
          return res.status(200).json({ voices });
        } else {
          // Return default voices as fallback
          return res.status(200).json({ 
            voices: [
              { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', labels: { accent: 'american', gender: 'female' } },
              { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', labels: { accent: 'american', gender: 'female' } },
              { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', labels: { accent: 'american', gender: 'female' } },
              { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', labels: { accent: 'american', gender: 'male' } },
              { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', labels: { accent: 'american', gender: 'female' } },
              { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', labels: { accent: 'american', gender: 'male' } },
              { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', labels: { accent: 'american', gender: 'male' } },
              { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', labels: { accent: 'american', gender: 'male' } }
            ]
          });
        }
      } catch (err) {
        console.error('ElevenLabs voices error:', err);
        return res.status(200).json({ voices: [] });
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
 * Process Premium AI Video Job in Background (Vercel)
 * This runs async after the response is sent
 */
async function processPremiumJobVercel(jobId) {
  const job = await getPremiumJob(jobId);
  if (!job) {
    console.error(`[${jobId}] Job not found for processing`);
    return;
  }

  const { 
    prompt, businessName, industry, contentPurpose, aspectRatio, voice, 
    includeSubtitles, subtitleStyle, logoUrl, logoPosition, logoSize,
    brandImages = [], productImages = [], 
    userClassifiedProducts = [], userClassifiedLifestyle = [],
    productName = '', productDescription = ''
  } = job.input;

  // Combine all available product/brand images
  const availableProductImages = [...productImages, ...brandImages].filter(Boolean);
  console.log(`[${jobId}] 📸 Available product images for scenes: ${availableProductImages.length}`);
  console.log(`[${jobId}] 🏷️ User pre-classified: ${userClassifiedProducts.length} products, ${userClassifiedLifestyle.length} lifestyle`);

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
    // STEP 2.5: Classify brand images
    // Use user classifications first, then GPT Vision for unclassified images
    // ============================================
    let classifiedImages = {
      productShots: [],    // Clean product photos
      lifestyleShots: [],  // People using the product
      logoImages: [],      // Brand logos
      otherImages: []      // Everything else
    };

    // First, add user pre-classified images (these skip GPT Vision)
    if (userClassifiedProducts.length > 0) {
      classifiedImages.productShots = userClassifiedProducts.map(url => ({ url, description: 'user-classified product' }));
      console.log(`[${jobId}] ✅ Using ${userClassifiedProducts.length} user-classified PRODUCT images`);
    }
    if (userClassifiedLifestyle.length > 0) {
      classifiedImages.lifestyleShots = userClassifiedLifestyle.map(url => ({ url, description: 'user-classified lifestyle' }));
      console.log(`[${jobId}] ✅ Using ${userClassifiedLifestyle.length} user-classified LIFESTYLE images`);
    }

    // Find images that still need classification (not in user-classified lists)
    const alreadyClassified = new Set([...userClassifiedProducts, ...userClassifiedLifestyle]);
    const needsClassification = availableProductImages.filter(url => !alreadyClassified.has(url));

    if (needsClassification.length > 0) {
      await updatePremiumJobStatus(jobId, {
        statusMessage: `🔍 Analyzing ${needsClassification.length} unclassified images...`,
        progress: 22
      });

      try {
        // Use GPT-4 Vision to classify remaining images
        const classificationPrompt = `Analyze these ${needsClassification.length} brand images and classify each one.

For each image, determine if it's:
1. "product" - A clean product shot showing just the product
2. "lifestyle" - Shows people using/interacting with the product  
3. "logo" - A brand logo or brand name image
4. "other" - Something else (background, graphics, etc.)

Product being advertised: ${prompt}
${productName ? `Product name: ${productName}` : ''}
${productDescription ? `Product description: ${productDescription}` : ''}

Return JSON array with classification for each image by index:
[{"index": 0, "type": "product", "description": "product bottle on white background"}, ...]`;

        const visionMessages = [
          {
            role: 'user',
            content: [
              { type: 'text', text: classificationPrompt },
              ...needsClassification.slice(0, 6).map(url => ({
                type: 'image_url',
                image_url: { url, detail: 'low' }
              }))
            ]
          }
        ];

        const visionResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: visionMessages,
          max_tokens: 500
        });

        const classificationResult = visionResponse.choices[0].message.content;
        const jsonMatch = classificationResult.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          const classifications = JSON.parse(jsonMatch[0]);
          console.log(`[${jobId}] 📊 GPT Vision classifications:`, classifications);

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
        console.warn(`[${jobId}] ⚠️ GPT Vision classification failed, treating unclassified as product shots:`, classifyErr.message);
        // Fallback: treat unclassified as product shots
        needsClassification.forEach(url => {
          classifiedImages.productShots.push({ url, description: 'auto-fallback product' });
        });
      }
    }

    console.log(`[${jobId}] ✅ Final classified totals: ${classifiedImages.productShots.length} product, ${classifiedImages.lifestyleShots.length} lifestyle, ${classifiedImages.logoImages.length} logo`);

    // ============================================
    // STEP 3: Prepare scene images
    // SMART MATCHING: Use the RIGHT image type for each scene
    // ============================================
    const scenesWithImages = [];
    const hasClassifiedImages = classifiedImages.productShots.length > 0 || classifiedImages.lifestyleShots.length > 0;
    
    console.log(`[${jobId}] 🖼️ Image strategy: ${hasClassifiedImages ? 'Using CLASSIFIED product images' : 'Generating with FLUX'}`);
    
    // Track which images we've used to avoid repetition
    let usedProductIdx = 0;
    let usedLifestyleIdx = 0;
    
    for (let i = 0; i < sceneBreakdown.scenes.length; i++) {
      const scene = sceneBreakdown.scenes[i];
      await updatePremiumJobStatus(jobId, {
        statusMessage: hasClassifiedImages 
          ? `🖼️ Matching image for scene ${i + 1}/${sceneBreakdown.scenes.length}...`
          : `🖼️ Creating image ${i + 1}/${sceneBreakdown.scenes.length}...`,
        progress: 25 + (i * 8)
      });

      let imageUrl = null;
      let imageType = 'generated';

      if (hasClassifiedImages) {
        // SMART SELECTION: Pick the RIGHT image type based on scene content
        const sceneText = `${scene.visualPrompt} ${scene.productAction} ${scene.motionPrompt}`.toLowerCase();
        
        // Determine what type of image this scene needs
        const needsLifestyle = sceneText.includes('person') || 
                              sceneText.includes('using') || 
                              sceneText.includes('applying') ||
                              sceneText.includes('holding') ||
                              sceneText.includes('enjoying') ||
                              sceneText.includes('wearing');
        
        const needsProductShot = sceneText.includes('close-up') || 
                                 sceneText.includes('product shot') ||
                                 sceneText.includes('display') ||
                                 sceneText.includes('showcase') ||
                                 sceneText.includes('packaging');

        let selectedImage = null;

        if (needsLifestyle && classifiedImages.lifestyleShots.length > 0) {
          // Use lifestyle/people image
          selectedImage = classifiedImages.lifestyleShots[usedLifestyleIdx % classifiedImages.lifestyleShots.length];
          usedLifestyleIdx++;
          imageType = 'lifestyle';
          console.log(`[${jobId}] Scene ${i + 1}: Using LIFESTYLE image (${selectedImage.description})`);
        } else if (classifiedImages.productShots.length > 0) {
          // Use clean product shot
          selectedImage = classifiedImages.productShots[usedProductIdx % classifiedImages.productShots.length];
          usedProductIdx++;
          imageType = 'product';
          console.log(`[${jobId}] Scene ${i + 1}: Using PRODUCT image (${selectedImage.description})`);
        } else if (classifiedImages.lifestyleShots.length > 0) {
          // Fallback to lifestyle if no product shots
          selectedImage = classifiedImages.lifestyleShots[usedLifestyleIdx % classifiedImages.lifestyleShots.length];
          usedLifestyleIdx++;
          imageType = 'lifestyle';
          console.log(`[${jobId}] Scene ${i + 1}: Fallback to LIFESTYLE image`);
        }

        if (selectedImage) {
          const productImageUrl = selectedImage.url;
          
          // Upload to Cloudinary for consistent handling (or use directly if already Cloudinary)
          if (productImageUrl.includes('cloudinary')) {
            imageUrl = productImageUrl;
          } else {
            try {
              const imgUpload = await cloudinary.uploader.upload(productImageUrl, {
                folder: 'premium-scenes',
                public_id: `${jobId}-img-${i}`
              });
              imageUrl = imgUpload.secure_url;
            } catch (uploadErr) {
              console.warn(`[${jobId}] Failed to upload product image, falling back to FLUX`);
              // Fall through to FLUX generation
            }
          }
        }
      }

      // Fallback: Generate with FLUX if no product image or upload failed
      if (!imageUrl) {
        imageType = 'generated';
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
          const imgUpload = await cloudinary.uploader.upload(fluxOutput[0], {
            folder: 'premium-scenes',
            public_id: `${jobId}-img-${i}`
          });
          imageUrl = imgUpload.secure_url;
        }
      }

      if (imageUrl) {
        scenesWithImages.push({ 
          ...scene, 
          imageUrl, 
          imageType, // 'product', 'lifestyle', or 'generated'
          usedProductImage: imageType !== 'generated' 
        });
        console.log(`[${jobId}] ✅ Scene ${i + 1} image ready (${imageType})`);
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
      // Tailor animation based on image TYPE (product shot vs lifestyle vs generated)
      
      const productDesc = productDescription || sceneBreakdown.productDescription || prompt;
      const actualProductName = productName || businessName || 'the product';
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

      // Different prompts based on IMAGE TYPE
      let fullMotionPrompt;
      let cfgScale = 0.5;

      // Build detailed product description for Kling to preserve
      // Include color, size, shape from the product description
      const productDetails = productDescription || productDesc || '';
      const colorMatch = productDetails.match(/\b(black|white|red|blue|green|yellow|orange|purple|pink|brown|gray|gold|silver)\b/i);
      const productColor = colorMatch ? colorMatch[0].toLowerCase() : '';
      
      if (scene.imageType === 'lifestyle') {
        // LIFESTYLE IMAGE: Has people - animate the person naturally
        // Be VERY specific about product appearance to prevent Kling from changing it
        
        fullMotionPrompt = `The person continues natural interaction with the product. ${motionPrompt}. 
CRITICAL PRODUCT RULES:
- Product is "${actualProductName}"${productColor ? ` which is ${productColor.toUpperCase()} colored` : ''}
- Keep product EXACTLY as shown in image - same size, same color, same position
- Do NOT enlarge, change color, or reposition the product
- Product stays in its EXACT location${productColor ? ` and stays ${productColor.toUpperCase()}` : ''}
Smooth realistic movement, commercial quality.`;
        cfgScale = 0.2; // Very low CFG to strictly preserve product
        
      } else if (scene.imageType === 'product') {
        // PRODUCT SHOT: Clean product image - very subtle animation, preserve product exactly
        fullMotionPrompt = `Product showcase of "${actualProductName}"${productColor ? ` (${productColor.toUpperCase()} colored)` : ''}.
STRICT RULES: Do NOT change product size, shape, or color. Keep product EXACTLY as shown.
${productColor ? `Product color is ${productColor.toUpperCase()} - do not change to any other color.` : ''}
Very subtle animation only: gentle lighting shift or soft camera movement around the unchanged product.`;
        cfgScale = 0.1; // Extremely low CFG to preserve product strictly
        
      } else {
        // GENERATED IMAGE: Full motion prompt with product context
        fullMotionPrompt = `PRODUCT: ${productDesc}${productColor ? ` (${productColor} colored)` : ''}. ${productAction ? `ACTION: ${productAction}. ` : ''}MOTION: ${motionPrompt}. Keep product appearance unchanged. Professional commercial quality.`;
        cfgScale = 0.4; // Lower for generated images too
      }

      // Enhanced negative prompt with color-specific terms
      const negativePrompt = `blur, distortion, low quality, shaky, amateur, text, watermark, change product, different product, wrong product, morph product, alter design, enlarge product, grow product, expand product${productColor === 'black' ? ', white product, change to white' : ''}${productColor === 'white' ? ', black product, change to black' : ''}, change color, wrong color, different color, color shift, resize product`;

      console.log(`[${jobId}] Scene ${i + 1} (${scene.imageType}): CFG=${cfgScale}, color=${productColor || 'unknown'}, ${fullMotionPrompt.substring(0, 80)}...`);

      // Use Kling v2.1 for image-to-video
      const prediction = await replicate.predictions.create({
        model: "kwaivgi/kling-v2.1-5s-i2v",
        input: {
          image: scene.imageUrl,
          prompt: fullMotionPrompt,
          negative_prompt: negativePrompt,
          cfg_scale: cfgScale,
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

    // Add logo if provided - prefer classified logo from GPT Vision
    const actualLogoUrl = classifiedImages.logoImages.length > 0 
      ? classifiedImages.logoImages[0].url 
      : logoUrl;
    console.log(`[${jobId}] 🏷️ Logo: ${actualLogoUrl ? 'Using ' + (classifiedImages.logoImages.length > 0 ? 'CLASSIFIED' : 'provided') + ' logo' : 'No logo'}`);
    
    if (actualLogoUrl) {
      // Map position to Shotstack format with safe margins
      const positionMap = {
        'topRight': { position: 'topRight', offset: { x: -0.03, y: 0.03 } },
        'topLeft': { position: 'topLeft', offset: { x: 0.03, y: 0.03 } },
        'bottomRight': { position: 'bottomRight', offset: { x: -0.03, y: -0.12 } }, // Above subtitles
        'bottomLeft': { position: 'bottomLeft', offset: { x: 0.03, y: -0.12 } }
      };
      const logoPos = positionMap[logoPosition] || positionMap['topRight'];
      
      const logoClip = {
        asset: { type: 'image', src: actualLogoUrl },
        start: 0,
        length: animatedScenes.length * 5,
        position: logoPos.position,
        offset: logoPos.offset,
        scale: Math.min(logoSize, 0.15), // Cap logo size to prevent overflow
        opacity: 0.9 // Slight transparency for professional look
      };
      timeline.tracks.unshift({ clips: [logoClip] });
    }

    // Add subtitles track - positioned safely within frame
    // Format text to max 15 chars per line to prevent overflow
    if (subtitles.length > 0) {
      const subClips = subtitles.map(sub => {
        // Split long text into short lines (max ~15 chars) for viral style
        const words = sub.text.trim().split(/\s+/);
        let formattedText = sub.text.toUpperCase();
        
        if (sub.text.length > 15) {
          const lines = [];
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length > 15 && currentLine) {
              lines.push(currentLine.toUpperCase());
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine.toUpperCase());
          formattedText = lines.join('\n');
        }
        
        return {
          asset: {
            type: 'title',
            text: formattedText,
            style: 'chunk',
            size: 'small', // Smaller to fit better
            color: '#ffffff',
            background: '#000000cc' // More opaque for readability
          },
          start: sub.start,
          length: sub.end - sub.start,
          position: 'bottom',
          offset: { y: -0.08 } // Move UP from bottom edge to stay in frame
        };
      });
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
