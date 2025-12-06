/**
 * Stock Video Service
 * 
 * Integrates with Pexels and Pixabay APIs to fetch stock video loops
 * for background videos that match voiceover duration.
 * 
 * APIs:
 * - Pexels: https://www.pexels.com/api/documentation/#videos
 * - Pixabay: https://pixabay.com/api/docs/#api_search_videos
 */

const OpenAI = require('openai');

// Read API keys at runtime (not module load time) for Vercel compatibility
// Fallback to hardcoded key if env variable not set
const PEXELS_HARDCODED_KEY = '9kV0qJ9k1b1Ou9BTGXFDPyFrqjU4oqGsuJ0tbzor5r2O942zz6WMyIyl';
const getPexelsKey = () => process.env.PEXELS_API_KEY || PEXELS_HARDCODED_KEY;
const getPixabayKey = () => process.env.PIXABAY_API_KEY;

// Popular categories for vertical videos
const VIDEO_CATEGORIES = {
  'tips': ['lifestyle', 'technology', 'office', 'work', 'professional'],
  'facts': ['technology', 'science', 'data', 'abstract', 'documentary'],
  'quotes': ['nature', 'sunset', 'ocean', 'mountains', 'peaceful', 'inspirational'],
  'story': ['people', 'urban', 'lifestyle', 'journey', 'cinematic', 'storytelling'],
  'tutorial': ['hands', 'workspace', 'technology', 'demonstration', 'step by step'],
  'motivation': ['nature', 'sunrise', 'ocean', 'mountains', 'city', 'success', 'achievement'],
  'education': ['books', 'study', 'technology', 'abstract', 'learning'],
  'lifestyle': ['urban', 'nature', 'travel', 'city life'],
  'business': ['office', 'meeting', 'technology', 'work', 'professional'],
  'fitness': ['gym', 'running', 'yoga', 'sports'],
  'food': ['cooking', 'kitchen', 'food', 'restaurant'],
  'travel': ['travel', 'airplane', 'beach', 'city'],
  'fashion': ['fashion', 'style', 'shopping', 'urban'],
  'tech': ['technology', 'computer', 'coding', 'abstract'],
  'default': ['abstract', 'light', 'particles', 'gradient', 'motion']
};

// Map concepts to cinematic stock video search terms
const CONCEPT_TO_VIDEO_MAP = {
  // Fitness specific
  'abs': 'abs workout crunch exercise',
  'core': 'core workout plank exercise',
  'plank': 'plank exercise core workout',
  'crunch': 'crunch abs exercise gym',
  'pushup': 'pushups exercise workout',
  'squat': 'squats leg workout gym',
  'deadlift': 'deadlift weightlifting gym',
  'cardio': 'running cardio treadmill',
  'hiit': 'hiit workout intense exercise',
  'stretch': 'stretching yoga flexibility',
  'warmup': 'warmup stretching exercise',
  'cooldown': 'stretching relaxing cooldown',
  'muscle': 'muscular bodybuilder gym',
  'bicep': 'bicep curl workout arm',
  'tricep': 'tricep workout arm exercise',
  'chest': 'chest workout pushup bench',
  'back': 'back workout pullup gym',
  'shoulder': 'shoulder workout gym',
  'leg': 'leg workout squats gym',
  'glute': 'glute workout hip exercise',
  
  // Health & Wellness
  'water': 'drinking water hydration',
  'hydrate': 'drinking water bottle',
  'sleep': 'person sleeping bed',
  'rest': 'person resting relaxing',
  'diet': 'healthy food meal prep',
  'nutrition': 'healthy food vegetables',
  'protein': 'protein food chicken eggs',
  'calories': 'food nutrition tracking',
  'meal': 'healthy meal cooking',
  'breakfast': 'breakfast healthy morning',
  'lunch': 'healthy lunch meal',
  'dinner': 'healthy dinner cooking',
  'stress': 'meditation relaxing calm',
  'meditation': 'meditation yoga peaceful',
  'yoga': 'yoga stretching peaceful',
  'wellness': 'wellness spa relaxation',
  
  // Emotions/States
  'success': 'person celebrating achievement',
  'happy': 'happy person smiling',
  'motivation': 'determined athlete training',
  'discipline': 'focused person training',
  'confidence': 'confident person walking',
  'focus': 'person concentrated working',
  'determination': 'athlete pushing hard',
  'energy': 'energetic person active',
  'tired': 'exhausted person resting',
  'struggle': 'person struggling trying',
  'fail': 'person frustrated struggling',
  'win': 'person winning celebrating',
  
  // Actions
  'run': 'person running jogging',
  'walk': 'person walking outdoor',
  'jump': 'person jumping exercise',
  'lift': 'person lifting weights',
  'train': 'athlete training gym',
  'workout': 'person workout gym',
  'exercise': 'person exercising fitness',
  'eat': 'person eating food',
  'drink': 'person drinking water',
  'cook': 'cooking kitchen food',
  'work': 'person working laptop',
  'study': 'person studying reading',
  'read': 'person reading book',
  'write': 'person writing notes',
  'think': 'person thinking contemplating',
  'plan': 'person planning calendar',
  
  // Time
  'morning': 'sunrise morning wakeup',
  'night': 'night city lights',
  'daily': 'daily routine morning',
  'weekly': 'calendar planning week',
  'routine': 'morning routine lifestyle',
  
  // Business/Money
  'money': 'money cash dollars',
  'business': 'business office professional',
  'invest': 'investment stocks finance',
  'save': 'saving money piggybank',
  'rich': 'luxury wealth success',
  'poor': 'struggling financial stress',
  'job': 'working office professional',
  'career': 'professional business success',
  'entrepreneur': 'entrepreneur working startup',
  
  // Lifestyle
  'travel': 'travel adventure destination',
  'nature': 'nature landscape scenic',
  'beach': 'beach ocean waves',
  'mountain': 'mountain hiking outdoor',
  'city': 'city urban lifestyle',
  'home': 'home interior cozy',
  'family': 'family together home',
  'friends': 'friends socializing together',
  'love': 'couple romance love',
  
  // Abstract (improved mappings)
  'idea': 'lightbulb inspiration creative',
  'dream': 'dreamy clouds fantasy',
  'power': 'powerful strong energy',
  'freedom': 'freedom flying birds sky',
  'growth': 'plant growing nature',
  'change': 'transformation butterfly',
  'journey': 'road path walking',
  'results': 'before after transformation',
  'progress': 'progress improvement growth',
  'consistency': 'person training daily gym',
  'mindset': 'person thinking meditation',
  'key': 'unlock solution answer',
  'secret': 'reveal showing explaining',
  'tip': 'advice teaching explaining',
  'hack': 'clever solution shortcut'
};

/**
 * Search videos from Pexels API
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of video objects
 */
async function searchPexelsVideos(query, options = {}) {
  const PEXELS_API_KEY = getPexelsKey();
  
  console.log(`🔍 PEXELS DEBUG: Checking API key...`);
  console.log(`   Key exists: ${!!PEXELS_API_KEY}`);
  console.log(`   Key length: ${PEXELS_API_KEY ? PEXELS_API_KEY.length : 0}`);
  console.log(`   Query: "${query}"`);
  
  if (!PEXELS_API_KEY) {
    console.log('⚠️ Pexels API key not configured (env: PEXELS_API_KEY)');
    return [];
  }

  const {
    orientation = 'portrait', // portrait for 9:16
    perPage = 10,
    minDuration = 5,
    maxDuration = 60
  } = options;

  try {
    const url = new URL('https://api.pexels.com/videos/search');
    url.searchParams.append('query', query);
    url.searchParams.append('orientation', orientation);
    url.searchParams.append('per_page', perPage);
    url.searchParams.append('size', 'medium'); // medium quality for faster loading

    console.log(`🎬 Searching Pexels for: "${query}" (key: ${PEXELS_API_KEY ? 'present' : 'missing'})`);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    console.log(`   Pexels response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   Pexels error response: ${errorText}`);
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`   Pexels returned ${data.videos?.length || 0} videos total`);

    // Filter and transform videos
    const videos = (data.videos || [])
      .filter(video => video.duration >= minDuration && video.duration <= maxDuration)
      .map(video => {
        // Get the best quality file for mobile (720p or 1080p)
        const videoFile = video.video_files.find(f => 
          f.quality === 'hd' && f.width <= 1920
        ) || video.video_files.find(f => 
          f.quality === 'sd'
        ) || video.video_files[0];

        return {
          id: video.id,
          source: 'pexels',
          url: videoFile?.link,
          thumbnail: video.image,
          duration: video.duration,
          width: videoFile?.width || video.width,
          height: videoFile?.height || video.height,
          user: video.user?.name,
          userUrl: video.user?.url
        };
      })
      .filter(v => v.url); // Only include videos with valid URLs

    console.log(`   Found ${videos.length} videos from Pexels`);
    return videos;

  } catch (error) {
    console.error('Pexels search error:', error.message);
    return [];
  }
}

/**
 * Search videos from Pixabay API
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of video objects
 */
async function searchPixabayVideos(query, options = {}) {
  const PIXABAY_API_KEY = getPixabayKey();
  
  if (!PIXABAY_API_KEY) {
    console.log('⚠️ Pixabay API key not configured');
    return [];
  }

  const {
    perPage = 10,
    minDuration = 5,
    maxDuration = 60,
    videoType = 'all' // film, animation, all
  } = options;

  try {
    const url = new URL('https://pixabay.com/api/videos/');
    url.searchParams.append('key', PIXABAY_API_KEY);
    url.searchParams.append('q', query);
    url.searchParams.append('per_page', perPage);
    url.searchParams.append('video_type', videoType);
    url.searchParams.append('safesearch', 'true');

    console.log(`🎬 Searching Pixabay for: "${query}"`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter and transform videos
    const videos = (data.hits || [])
      .filter(video => video.duration >= minDuration && video.duration <= maxDuration)
      .map(video => {
        // Get medium quality for balance of quality and speed
        const videoFile = video.videos?.medium || video.videos?.small || video.videos?.large;

        return {
          id: video.id,
          source: 'pixabay',
          url: videoFile?.url,
          thumbnail: `https://i.vimeocdn.com/video/${video.picture_id}_640x360.jpg`,
          duration: video.duration,
          width: videoFile?.width || 1920,
          height: videoFile?.height || 1080,
          user: video.user,
          userUrl: `https://pixabay.com/users/${video.user}-${video.user_id}/`
        };
      })
      .filter(v => v.url);

    console.log(`   Found ${videos.length} videos from Pixabay`);
    return videos;

  } catch (error) {
    console.error('Pixabay search error:', error.message);
    return [];
  }
}

/**
 * Search all stock video sources
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Combined array of videos from all sources
 */
async function searchStockVideos(query, options = {}) {
  console.log(`🎬 Searching stock videos for: "${query}"`);
  
  // Search both APIs in parallel
  const [pexelsVideos, pixabayVideos] = await Promise.all([
    searchPexelsVideos(query, options),
    searchPixabayVideos(query, options)
  ]);

  // Combine and shuffle results for variety
  const combined = [...pexelsVideos, ...pixabayVideos];
  
  // Shuffle array
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  console.log(`   Total: ${combined.length} videos found`);
  return combined;
}

/**
 * Get the best keyword for video search based on content type
 * 
 * @param {string} topic - User's topic
 * @param {string} contentType - Type of content (tips, motivation, etc.)
 * @returns {string} - Optimized search query
 */
function getOptimizedQuery(topic, contentType = 'default') {
  const categories = VIDEO_CATEGORIES[contentType.toLowerCase()] || VIDEO_CATEGORIES.default;
  
  // Extract key words from topic
  const topicWords = topic.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3)
    .slice(0, 2);

  // If we have topic words, use them with a category keyword
  if (topicWords.length > 0) {
    return `${topicWords.join(' ')} ${categories[0]}`;
  }

  // Otherwise use category keywords
  return categories.join(' ');
}

/**
 * Get a random stock video based on topic and content type
 * Useful for background videos that match voiceover content
 * 
 * @param {string} topic - User's topic/prompt
 * @param {string} contentType - Type of content
 * @param {Object} options - Search options
 * @returns {Promise<Object|null>} - Video object or null
 */
async function getRandomStockVideo(topic, contentType = 'default', options = {}) {
  const query = getOptimizedQuery(topic, contentType);
  const videos = await searchStockVideos(query, { 
    ...options,
    perPage: 15 // Get more options
  });

  if (videos.length === 0) {
    // Fallback to abstract/generic backgrounds
    console.log('⚠️ No videos found, trying fallback search...');
    const fallbackVideos = await searchStockVideos('abstract light particles background', {
      ...options,
      perPage: 10
    });
    
    if (fallbackVideos.length > 0) {
      return fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)];
    }
    
    return null;
  }

  // Return a random video from results
  return videos[Math.floor(Math.random() * videos.length)];
}

/**
 * Get multiple stock video clips for stitching
 * Useful for creating longer videos from multiple short clips
 * 
 * @param {string} topic - Search topic
 * @param {number} targetDuration - Desired total duration in seconds
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of video clips that sum to target duration
 */
async function getVideoClipsForDuration(topic, targetDuration = 30, options = {}) {
  const query = getOptimizedQuery(topic, options.contentType);
  const videos = await searchStockVideos(query, {
    ...options,
    perPage: 20,
    minDuration: 3,
    maxDuration: 30
  });

  if (videos.length === 0) {
    return [];
  }

  // Select videos to fill the target duration
  const selectedClips = [];
  let totalDuration = 0;

  // Shuffle videos for variety
  const shuffled = [...videos].sort(() => Math.random() - 0.5);

  for (const video of shuffled) {
    if (totalDuration >= targetDuration) break;

    const remainingDuration = targetDuration - totalDuration;
    
    // Calculate how much of this clip to use
    const clipDuration = Math.min(video.duration, remainingDuration);
    
    selectedClips.push({
      ...video,
      useDuration: clipDuration,
      startAt: 0 // Start from beginning
    });
    
    totalDuration += clipDuration;
  }

  console.log(`📹 Selected ${selectedClips.length} clips for ${totalDuration}s (target: ${targetDuration}s)`);
  return selectedClips;
}

/**
 * Curated list of generic looping background videos
 * Using direct Pexels video URLs that are known to work
 * These serve as fallback when Pexels API search returns empty
 */
const CURATED_BACKGROUNDS = {
  abstract: [
    { name: 'Abstract Particles', url: 'https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4', duration: 10 },
    { name: 'Blue Motion', url: 'https://videos.pexels.com/video-files/852400/852400-sd_640_360_30fps.mp4', duration: 12 },
    { name: 'Light Rays', url: 'https://videos.pexels.com/video-files/856974/856974-sd_640_360_25fps.mp4', duration: 15 }
  ],
  nature: [
    { name: 'Ocean Waves', url: 'https://videos.pexels.com/video-files/1093662/1093662-sd_640_360_30fps.mp4', duration: 15 },
    { name: 'Forest', url: 'https://videos.pexels.com/video-files/857251/857251-sd_640_360_30fps.mp4', duration: 10 },
    { name: 'Mountains', url: 'https://videos.pexels.com/video-files/1448735/1448735-sd_640_360_24fps.mp4', duration: 12 }
  ],
  urban: [
    { name: 'City Lights', url: 'https://videos.pexels.com/video-files/1826896/1826896-sd_640_360_25fps.mp4', duration: 12 },
    { name: 'City Night', url: 'https://videos.pexels.com/video-files/856025/856025-sd_640_360_25fps.mp4', duration: 10 }
  ],
  tech: [
    { name: 'Tech Abstract', url: 'https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4', duration: 10 },
    { name: 'Data Flow', url: 'https://videos.pexels.com/video-files/3945029/3945029-sd_640_360_25fps.mp4', duration: 8 }
  ],
  fitness: [
    { name: 'Gym Workout', url: 'https://videos.pexels.com/video-files/4761440/4761440-sd_640_360_25fps.mp4', duration: 15 },
    { name: 'Running Outdoor', url: 'https://videos.pexels.com/video-files/4761637/4761637-sd_640_360_25fps.mp4', duration: 12 },
    { name: 'Weights Training', url: 'https://videos.pexels.com/video-files/4761718/4761718-sd_640_360_25fps.mp4', duration: 10 },
    { name: 'Yoga Stretch', url: 'https://videos.pexels.com/video-files/4325473/4325473-sd_640_360_25fps.mp4', duration: 15 },
    { name: 'Abs Exercise', url: 'https://videos.pexels.com/video-files/4761523/4761523-sd_640_360_25fps.mp4', duration: 12 }
  ],
  motivation: [
    { name: 'Sunrise Run', url: 'https://videos.pexels.com/video-files/4761637/4761637-sd_640_360_25fps.mp4', duration: 12 },
    { name: 'Success Celebration', url: 'https://videos.pexels.com/video-files/3015488/3015488-sd_640_360_24fps.mp4', duration: 10 }
  ],
  business: [
    { name: 'Office Work', url: 'https://videos.pexels.com/video-files/3252127/3252127-sd_640_360_25fps.mp4', duration: 12 },
    { name: 'Laptop Working', url: 'https://videos.pexels.com/video-files/5313170/5313170-sd_640_360_25fps.mp4', duration: 10 }
  ],
  health: [
    { name: 'Healthy Food', url: 'https://videos.pexels.com/video-files/4253310/4253310-sd_640_360_25fps.mp4', duration: 15 },
    { name: 'Water Drinking', url: 'https://videos.pexels.com/video-files/4156933/4156933-sd_640_360_25fps.mp4', duration: 8 }
  ]
};

/**
 * Get a curated background video by category
 * 
 * @param {string} category - abstract, nature, urban, tech
 * @returns {Object|null} - Video object
 */
function getCuratedBackground(category = 'abstract') {
  const backgrounds = CURATED_BACKGROUNDS[category] || CURATED_BACKGROUNDS.abstract;
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}

/**
 * Improve search term using concept mapping for better stock video results
 * Maps abstract concepts to more visual, searchable terms
 */
function improveSearchTerm(term) {
  if (!term || term.length < 3) return 'abstract background';
  
  const words = term.toLowerCase().split(/\s+/);
  const improvedWords = [];
  
  // Check each word against concept map
  for (const word of words) {
    if (CONCEPT_TO_VIDEO_MAP[word]) {
      // Found a mapping - use the video-friendly term
      return CONCEPT_TO_VIDEO_MAP[word];
    }
    improvedWords.push(word);
  }
  
  // Check for partial matches in the full term
  for (const [concept, videoTerm] of Object.entries(CONCEPT_TO_VIDEO_MAP)) {
    if (term.toLowerCase().includes(concept)) {
      return videoTerm;
    }
  }
  
  // Add "cinematic" to make results more video-appropriate
  const improvedTerm = improvedWords.slice(0, 2).join(' ');
  if (improvedTerm.length > 3) {
    return improvedTerm + ' cinematic';
  }
  
  return 'abstract motion background';
}

/**
 * AI-Powered Search Query Generator
 * Uses GPT to convert scene descriptions/topics into optimal stock video search terms
 * 
 * @param {Array} scenes - Array of scene objects with visual/text fields
 * @param {Object} context - Optional context like industry, brandVoice, etc.
 * @returns {Promise<Array>} - Scenes with improved stockSearchQuery field
 */
async function generateSmartSearchQueries(scenes, context = {}) {
  if (!scenes || scenes.length === 0) return scenes;
  
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.log('⚠️ OpenAI key not available - using basic search terms');
    return scenes.map(s => ({ ...s, stockSearchQuery: s.visual || 'abstract background' }));
  }

  try {
    const openai = new OpenAI({ apiKey: openaiKey });
    
    // Build scene descriptions for the prompt
    const sceneDescriptions = scenes.map((s, i) => 
      `Scene ${i + 1}: Visual="${s.visual || 'none'}", Voiceover="${(s.text || '').substring(0, 80)}"`
    ).join('\n');
    
    const industryHint = context.industry ? `Industry: ${context.industry}` : '';
    const brandHint = context.businessName ? `Brand: ${context.businessName}` : '';
    
    const prompt = `You are a stock video search expert. Convert these scene descriptions into optimal Pexels/stock video search queries.

${industryHint}
${brandHint}
Topic: ${context.topic || 'general content'}

SCENES:
${sceneDescriptions}

RULES for search queries:
1. Use 2-4 simple, concrete words that exist in stock libraries
2. Prefer action words: "woman running", "coffee pouring", "hands typing"
3. Avoid abstract concepts: instead of "success" use "celebration confetti" or "trophy winner"
4. Avoid brand-specific terms that won't exist in stock libraries
5. Think cinematically: what would a video editor search for?
6. For business content: "office meeting", "laptop working", "handshake deal"
7. For fitness: "gym workout", "running outdoor", "yoga stretching"
8. For food: "cooking kitchen", "food plating", "chef preparing"

Return ONLY a JSON array of search queries in the same order as scenes:
["query1", "query2", "query3", ...]`;

    console.log('🧠 Generating smart search queries with AI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const content = response.choices[0].message.content.trim();
    
    // Parse the JSON array
    let queries = [];
    try {
      // Handle potential markdown code blocks
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      queries = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.log('⚠️ Failed to parse AI response, using fallback');
      return scenes.map(s => ({ ...s, stockSearchQuery: s.visual || 'abstract background' }));
    }
    
    // Apply queries to scenes
    const enhancedScenes = scenes.map((scene, i) => ({
      ...scene,
      stockSearchQuery: queries[i] || scene.visual || 'cinematic background',
      originalVisual: scene.visual
    }));
    
    console.log('✅ Smart search queries generated:');
    enhancedScenes.forEach((s, i) => {
      console.log(`   Scene ${i + 1}: "${s.originalVisual}" → "${s.stockSearchQuery}"`);
    });
    
    return enhancedScenes;
    
  } catch (error) {
    console.error('❌ AI search query generation failed:', error.message);
    return scenes.map(s => ({ ...s, stockSearchQuery: s.visual || 'abstract background' }));
  }
}

module.exports = {
  searchPexelsVideos,
  searchPixabayVideos,
  searchStockVideos,
  getRandomStockVideo,
  getVideoClipsForDuration,
  getVideosForScenes,
  getOptimizedQuery,
  getCuratedBackground,
  improveSearchTerm,
  smartImproveSearchTerm,
  getRelatedSearchTerm,
  generateSmartSearchQueries,
  VIDEO_CATEGORIES,
  CURATED_BACKGROUNDS,
  CONCEPT_TO_VIDEO_MAP
};

// Import curated video database
const { getCuratedVideoForTerm, getCuratedVideosForScenes } = require('./curatedVideos');

/**
 * Get different stock videos for each scene/segment
 * PRIORITY 1: Use curated videos (guaranteed to match)
 * PRIORITY 2: Pexels API search (fallback, less reliable)
 * 
 * @param {Array} scenes - Array of { searchTerm, duration, startTime, endTime }
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of video clips matched to scenes
 */
async function getVideosForScenes(scenes, options = {}) {
  if (!scenes || scenes.length === 0) {
    return [];
  }

  const contentType = options.contentType || 'fitness';
  console.log(`🎬 Finding videos for ${scenes.length} scenes (${contentType} content)...`);
  console.log(`   📦 PRIORITY 1: Curated video database`);
  
  const sceneClips = [];
  const usedVideoIds = new Set();
  
  for (const scene of scenes) {
    const searchTerm = scene.searchTerm || scene.keywords || 'fitness workout';
    const sceneDuration = scene.duration || (scene.endTime - scene.startTime) || 10;
    
    console.log(`   Scene ${scene.index + 1}: "${searchTerm}" (${sceneDuration.toFixed(1)}s)`);
    
    // ========== STEP 1: TRY CURATED VIDEOS FIRST ==========
    let video = getCuratedVideoForTerm(searchTerm, contentType);
    
    // Check if we already used this video
    let curatedAttempts = 0;
    while (video && usedVideoIds.has(video.id) && curatedAttempts < 5) {
      video = getCuratedVideoForTerm(searchTerm, contentType);
      curatedAttempts++;
    }
    
    if (video && !usedVideoIds.has(video.id)) {
      usedVideoIds.add(video.id);
      sceneClips.push({
        ...video,
        sceneIndex: scene.index,
        sceneSearchTerm: searchTerm,
        useDuration: sceneDuration,
        startAt: scene.startTime || 0,
        endAt: scene.endTime || (scene.startTime + sceneDuration),
        playbackStart: scene.startTime || 0,
        playbackDuration: sceneDuration
      });
      console.log(`      ✅ CURATED: "${video.matchedKeyword}" → ${video.description}`);
      continue; // Move to next scene
    }
    
    // ========== STEP 2: FALLBACK TO PEXELS API ==========
    console.log(`      ⚠️ No curated match, trying Pexels API...`);
    
    const improvedTerm = smartImproveSearchTerm(searchTerm);
    let videos = [];
    let searchAttempt = 0;
    const searchStrategies = [
      improvedTerm,
      improvedTerm.split(' ').slice(0, 2).join(' '),
      getRelatedSearchTerm(improvedTerm),
      'fitness workout gym'
    ];
    
    while (videos.length === 0 && searchAttempt < searchStrategies.length) {
      const currentSearch = searchStrategies[searchAttempt];
      videos = await searchStockVideos(currentSearch, {
        ...options,
        perPage: 15,
        minDuration: 3,
        maxDuration: 60
      });
      searchAttempt++;
    }
    
    // Filter out used videos
    const availableVideos = videos.filter(v => !usedVideoIds.has(`${v.source}-${v.id}`));
    
    if (availableVideos.length > 0) {
      const apiVideo = availableVideos[Math.floor(Math.random() * Math.min(5, availableVideos.length))];
      usedVideoIds.add(`${apiVideo.source}-${apiVideo.id}`);
      
      sceneClips.push({
        ...apiVideo,
        sceneIndex: scene.index,
        sceneSearchTerm: searchTerm,
        useDuration: sceneDuration,
        startAt: scene.startTime || 0,
        endAt: scene.endTime || (scene.startTime + sceneDuration),
        playbackStart: scene.startTime || 0,
        playbackDuration: sceneDuration
      });
      console.log(`      ✅ PEXELS API: ${apiVideo.source} #${apiVideo.id}`);
    } else {
      // ========== STEP 3: ABSOLUTE FALLBACK ==========
      console.log(`      ⚠️ No API results, using default curated...`);
      const defaults = CURATED_BACKGROUNDS.fitness || CURATED_BACKGROUNDS.abstract;
      const fallbackVideo = defaults[Math.floor(Math.random() * defaults.length)];
      
      if (fallbackVideo) {
        sceneClips.push({
          id: `fallback-${Date.now()}-${scene.index}`,
          source: 'curated-fallback',
          url: fallbackVideo.url,
          description: fallbackVideo.name,
          duration: fallbackVideo.duration,
          sceneIndex: scene.index,
          sceneSearchTerm: 'fallback',
          useDuration: sceneDuration,
          startAt: scene.startTime || 0,
          endAt: scene.endTime || (scene.startTime + sceneDuration),
          playbackStart: scene.startTime || 0,
          playbackDuration: sceneDuration
        });
        console.log(`      ✅ FALLBACK: ${fallbackVideo.name}`);
      }
    }
  }
  
  console.log(`   📹 Total: ${sceneClips.length} scene clips ready`);
  console.log(`   📊 Sources: ${sceneClips.filter(v => v.source === 'curated').length} curated, ${sceneClips.filter(v => v.source === 'pexels').length} Pexels`);
  
  return sceneClips;
}

/**
 * Smart search term improvement - converts concepts to visual search terms
 */
function smartImproveSearchTerm(term) {
  if (!term || term.length < 3) return 'abstract background motion';
  
  const lowerTerm = term.toLowerCase();
  
  // Check for direct concept matches
  for (const [concept, videoTerm] of Object.entries(CONCEPT_TO_VIDEO_MAP)) {
    if (lowerTerm.includes(concept)) {
      return videoTerm;
    }
  }
  
  // Remove abstract words that don't search well
  const abstractWords = ['the', 'a', 'an', 'your', 'my', 'our', 'this', 'that', 'here', 'there', 'just', 'really', 'very', 'so', 'such'];
  const words = lowerTerm.split(' ').filter(w => !abstractWords.includes(w) && w.length > 2);
  
  if (words.length === 0) return 'lifestyle person modern';
  
  // Return cleaned term
  return words.slice(0, 3).join(' ');
}

/**
 * Get a related/alternative search term when original doesn't work
 */
function getRelatedSearchTerm(term) {
  const lowerTerm = term.toLowerCase();
  
  // Category-based alternatives
  const alternatives = {
    'workout': ['gym exercise fitness', 'training athlete', 'person exercising'],
    'gym': ['workout training fitness', 'exercise athlete', 'weightlifting'],
    'abs': ['core workout', 'crunches exercise', 'fitness training'],
    'muscle': ['bodybuilding gym', 'weightlifting', 'strength training'],
    'run': ['jogging outdoor', 'cardio fitness', 'athlete running'],
    'yoga': ['stretching meditation', 'flexibility exercise', 'wellness relaxation'],
    'food': ['cooking kitchen', 'healthy meal', 'nutrition eating'],
    'water': ['drinking hydration', 'health wellness', 'bottle liquid'],
    'sleep': ['resting bed', 'relaxation night', 'peaceful calm'],
    'morning': ['sunrise wakeup', 'daily routine', 'start day'],
    'success': ['celebration achievement', 'victory winner', 'happy accomplished'],
    'money': ['finance cash', 'wealth success', 'business profit'],
    'business': ['office professional', 'corporate work', 'entrepreneur laptop']
  };
  
  // Find a matching alternative
  for (const [key, alts] of Object.entries(alternatives)) {
    if (lowerTerm.includes(key)) {
      return alts[Math.floor(Math.random() * alts.length)];
    }
  }
  
  // Generic fallback
  return 'person lifestyle modern';
}
