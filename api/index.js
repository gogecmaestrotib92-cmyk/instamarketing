// Vercel Serverless API Handler with AI Integration
const Replicate = require('replicate');

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

module.exports = async (req, res) => {
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
      timestamp: new Date().toISOString(),
      replicate: !!process.env.REPLICATE_API_TOKEN,
      openai: !!process.env.OPENAI_API_KEY
    });
  }

  // Auth routes
  if (url === '/api/auth/me') {
    return res.status(200).json({
      _id: 'user123',
      name: 'Demo User',
      email: 'demo@instamarketing.rs',
      plan: 'Pro',
      instagramConnected: false
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

  // ==================== AI VIDEO GENERATION ====================
  
  // Text to Video - Premium (Minimax)
  if (url === '/api/ai-video/text-to-video' && req.method === 'POST') {
    try {
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: 'REPLICATE_API_TOKEN nije konfigurisan' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { prompt, duration = 5, aspectRatio = '9:16' } = body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt je obavezan' });
      }

      console.log('🎬 Starting Minimax video generation:', prompt);

      // Use Minimax model for premium quality (6 seconds)
      const output = await replicate.run(
        "minimax/video-01",
        {
          input: {
            prompt: prompt,
            prompt_optimizer: true
          }
        }
      );

      console.log('✅ Video generated:', output);

      return res.status(200).json({
        success: true,
        video: {
          id: Date.now().toString(),
          videoUrl: output,
          prompt,
          duration,
          aspectRatio
        }
      });
    } catch (error) {
      console.error('❌ Video generation error:', error);
      
      if (error.message?.includes('Payment') || error.message?.includes('402') || error.message?.includes('billing')) {
        return res.status(402).json({ 
          error: 'Potrebna uplata na Replicate nalogu. Posetite replicate.com/account/billing',
          requiresPayment: true
        });
      }
      
      return res.status(500).json({ error: error.message || 'Greška pri generisanju videa' });
    }
  }

  // Start async video generation
  if (url === '/api/ai/video/start' && req.method === 'POST') {
    try {
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: 'REPLICATE_API_TOKEN nije konfigurisan' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { prompt, numFrames = 16, fps = 8 } = body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt je obavezan' });
      }

      // Start prediction without waiting
      const prediction = await replicate.predictions.create({
        version: "minimax/video-01",
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
    } catch (error) {
      console.error('Start video error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Check video status
  if (url.startsWith('/api/ai/video/status/') && req.method === 'GET') {
    try {
      const predictionId = url.split('/').pop();
      
      if (!predictionId) {
        return res.status(400).json({ error: 'Prediction ID je obavezan' });
      }

      const prediction = await replicate.predictions.get(predictionId);

      return res.status(200).json({
        status: prediction.status,
        output: prediction.output,
        error: prediction.error
      });
    } catch (error) {
      console.error('Status check error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // My Videos
  if (url === '/api/ai-video/my-videos') {
    return res.status(200).json({ videos: [] });
  }

  // ==================== AI TEXT GENERATION (OpenAI) ====================

  // Caption generation
  if (url === '/api/ai/caption' && req.method === 'POST') {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { topic, tone = 'engaging', includeEmojis = true, includeHashtags = true } = body;

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
    } catch (error) {
      console.error('Caption error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Hashtag generation
  if (url === '/api/ai/hashtags' && req.method === 'POST') {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { topic, count = 15 } = body;

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
    } catch (error) {
      console.error('Hashtags error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Script generation
  if (url === '/api/ai/script' && req.method === 'POST') {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { topic, duration = 30 } = body;

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
    } catch (error) {
      console.error('Script error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Content ideas
  if (url === '/api/ai/ideas' && req.method === 'POST') {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { niche, count = 5 } = body;

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
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(completion.choices[0].message.content);
      return res.status(200).json({ ideas: content.ideas || content });
    } catch (error) {
      console.error('Ideas error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // AI Chat
  if (url === '/api/ai/chat' && req.method === 'POST') {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY nije konfigurisan' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { message, history = [] } = body;

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
    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Default response
  return res.status(200).json({ 
    message: 'Route not configured',
    path: url,
    method: req.method
  });
};
    hint: 'This demo deployment has limited API functionality'
  });
};
