// Vercel Serverless API Handler with AI Integration

module.exports = async (req, res) => {
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
    
    // Text to Video - Premium (Minimax)
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
