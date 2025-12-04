/**
 * VIDEO JOB WORKER
 * =================
 * Processes video generation jobs step by step.
 * Each step updates job status for frontend polling.
 */

const VideoJob = require('../models/VideoJob');
const OpenAI = require('openai');
const axios = require('axios');
const FormData = require('form-data');
const cloudinary = require('cloudinary').v2;

// Initialize OpenAI lazily (to ensure env vars are loaded)
let openaiClient = null;
function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Initialize Cloudinary
cloudinary.config({
  cloud_name: 'ddvtwoyxp',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Curated videos database (Cloudinary-hosted)
const CURATED_VIDEOS = {
  fitness: [
    { id: '4761433', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852474/instamarketing/curated-videos/pexels-4761433.mp4', keywords: ['abs', 'floor', 'core', 'workout', 'exercise'], duration: 15 },
    { id: '5319340', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852477/instamarketing/curated-videos/pexels-5319340.mp4', keywords: ['training', 'core', 'gym', 'fitness'], duration: 10 },
    { id: '4761486', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852488/instamarketing/curated-videos/pexels-4761486.mp4', keywords: ['plank', 'side', 'stability', 'balance'], duration: 12 },
    { id: '4761718', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852495/instamarketing/curated-videos/pexels-4761718.mp4', keywords: ['dumbbell', 'weights', 'strength', 'arms'], duration: 12 },
    { id: '4761735', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852502/instamarketing/curated-videos/pexels-4761735.mp4', keywords: ['shoulder', 'press', 'overhead', 'strength'], duration: 10 }
  ],
  // TODO: Add more categories
  business: [],
  lifestyle: [],
  technology: [],
  food: [],
  travel: []
};

/**
 * STEP 1: Generate script and scenes
 */
async function generateScript(job) {
  await updateJobStatus(job, 'generating_script', 10, 'Generating script...');
  
  try {
    const openai = getOpenAI();
    
    const prompt = `Create a ${job.targetDuration}-second video script about: "${job.topic}"
  
  Return ONLY valid JSON in this exact format:
  {
    "hook": "Opening hook line (2-3 seconds)",
    "scenes": [
      {
        "text": "What the voiceover says for this scene",
        "visual": "Brief description of what video to show",
        "duration": 5
      }
    ],
    "cta": "Call to action (2-3 seconds)"
  }
  
  Rules:
  - Keep total duration close to ${job.targetDuration} seconds
  - Each scene should be 3-7 seconds
  - Make it punchy and engaging for social media
  - Visual descriptions should be simple: "person working out", "typing on laptop", etc.`;
  
    console.log(`[Job ${job._id}] Calling OpenAI for script generation...`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    console.log(`[Job ${job._id}] Script generated:`, content.hook);
    
    // Build scenes array
    const scenes = [];
    let order = 0;
    
    // Add hook as first scene
    scenes.push({
      order: order++,
      text: content.hook,
      duration: 3,
      visual: 'attention grabbing intro'
    });
    
    // Add main scenes
    for (const scene of content.scenes) {
      scenes.push({
        order: order++,
        text: scene.text,
        duration: scene.duration || 5,
        visual: scene.visual
      });
    }
    
    // Add CTA as last scene
    scenes.push({
      order: order++,
      text: content.cta,
      duration: 3,
      visual: 'call to action'
    });
    
    job.script = JSON.stringify(content);
    job.scenes = scenes;
    await job.save();
    
    console.log(`[Job ${job._id}] Generated ${scenes.length} scenes`);
    return job;
    
  } catch (error) {
    console.error(`[Job ${job._id}] Script generation error:`, error.message);
    throw new Error(`Script generation failed: ${error.message}`);
  }
}

/**
 * STEP 2: Find videos for each scene by searching Pexels
 */
async function findVideosForScenes(job) {
  await updateJobStatus(job, 'finding_videos', 30, 'Searching for matching videos...');
  
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  console.log(`[Job ${job._id}] Pexels API key configured: ${!!PEXELS_API_KEY}`);
  
  if (!PEXELS_API_KEY) {
    console.log(`[Job ${job._id}] ⚠️ No Pexels API key! Add PEXELS_API_KEY to Vercel env vars`);
    console.log(`[Job ${job._id}] Using fallback curated videos instead`);
    return useFallbackVideos(job);
  }
  
  // Search Pexels for each scene and upload to Cloudinary
  for (let i = 0; i < job.scenes.length; i++) {
    const scene = job.scenes[i];
    const searchQuery = scene.visual || job.topic;
    
    try {
      console.log(`[Job ${job._id}] Scene ${i}: Searching Pexels for "${searchQuery}"`);
      
      // Search Pexels
      const searchResponse = await axios.get(
        `https://api.pexels.com/videos/search`,
        {
          params: {
            query: searchQuery,
            orientation: 'portrait',
            size: 'medium',
            per_page: 5
          },
          headers: {
            'Authorization': PEXELS_API_KEY
          },
          timeout: 10000
        }
      );
      
      const videos = searchResponse.data.videos;
      if (!videos || videos.length === 0) {
        console.log(`[Job ${job._id}] Scene ${i}: No results, trying topic search`);
        // Fallback to topic search
        const topicResponse = await axios.get(
          `https://api.pexels.com/videos/search`,
          {
            params: {
              query: job.topic,
              orientation: 'portrait',
              size: 'medium',
              per_page: 5
            },
            headers: {
              'Authorization': PEXELS_API_KEY
            },
            timeout: 10000
          }
        );
        
        if (!topicResponse.data.videos || topicResponse.data.videos.length === 0) {
          throw new Error('No videos found');
        }
        
        videos.push(...topicResponse.data.videos);
      }
      
      // Pick a random video from results (to add variety)
      const randomIndex = Math.floor(Math.random() * Math.min(videos.length, 3));
      const selectedVideo = videos[randomIndex];
      
      // Find HD video file
      const videoFile = selectedVideo.video_files.find(f => 
        f.quality === 'hd' && f.height > f.width
      ) || selectedVideo.video_files.find(f => 
        f.quality === 'hd'
      ) || selectedVideo.video_files[0];
      
      console.log(`[Job ${job._id}] Scene ${i}: Downloading ${videoFile.width}x${videoFile.height}`);
      
      // Download video
      const videoResponse = await axios.get(videoFile.link, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const videoBuffer = Buffer.from(videoResponse.data);
      console.log(`[Job ${job._id}] Scene ${i}: Downloaded ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Upload to Cloudinary
      const cloudinaryUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'job-videos',
            public_id: `job_${job._id}_scene_${i}`
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(videoBuffer);
      });
      
      job.scenes[i].videoUrl = cloudinaryUrl;
      console.log(`[Job ${job._id}] Scene ${i}: Uploaded to ${cloudinaryUrl}`);
      
    } catch (error) {
      console.error(`[Job ${job._id}] Scene ${i} failed: ${error.message}, using fallback`);
      // Use fallback video
      const fallbackVideos = CURATED_VIDEOS.fitness;
      const fallback = fallbackVideos[i % fallbackVideos.length];
      job.scenes[i].videoUrl = fallback.url;
    }
    
    // Update progress
    const progress = 30 + Math.floor((i / job.scenes.length) * 15);
    await updateJobStatus(job, 'finding_videos', progress, `Finding videos... ${i + 1}/${job.scenes.length}`);
  }
  
  await job.save();
  return job;
}

/**
 * Fallback to curated videos when Pexels search fails
 */
function useFallbackVideos(job) {
  const fallbackVideos = CURATED_VIDEOS.fitness;
  for (let i = 0; i < job.scenes.length; i++) {
    const video = fallbackVideos[i % fallbackVideos.length];
    job.scenes[i].videoUrl = video.url;
  }
  return job;
}

/**
 * STEP 3: Generate voiceover for all scenes using ElevenLabs with timestamps
 */
async function generateVoiceover(job) {
  await updateJobStatus(job, 'generating_audio', 50, 'Generating voiceover...');
  
  // Combine all scene text
  const fullScript = job.scenes.map(s => s.text).join(' ');
  
  const voiceId = job.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default to Adam
  
  // Call ElevenLabs with timestamps
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      text: fullScript,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5
      }
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );
  
  const { audio_base64, alignment } = response.data;
  const audioBuffer = Buffer.from(audio_base64, 'base64');
  
  console.log(`[Job ${job._id}] Audio buffer size: ${audioBuffer.length} bytes`);
  
  // Verify Cloudinary is configured
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured');
  }
  
  // Upload to Cloudinary
  const audioUrl = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'voiceovers',
        public_id: `job_${job._id}_audio`
      },
      (error, result) => {
        if (error) {
          console.error(`[Job ${job._id}] Cloudinary upload error:`, error);
          reject(error);
        } else {
          console.log(`[Job ${job._id}] Audio uploaded to: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(audioBuffer);
  });
  
  job.audioUrl = audioUrl;
  
  // Build subtitles from alignment
  const subtitles = [];
  if (alignment && alignment.characters) {
    const chars = alignment.characters;
    const startTimes = alignment.character_start_times_seconds;
    const endTimes = alignment.character_end_times_seconds;
    
    // Group into words
    let currentWord = '';
    let wordStart = 0;
    let wordEnd = 0;
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (char === ' ' || i === chars.length - 1) {
        if (i === chars.length - 1 && char !== ' ') {
          currentWord += char;
          wordEnd = endTimes[i];
        }
        if (currentWord.trim()) {
          subtitles.push({
            text: currentWord.trim(),
            start: wordStart,
            end: wordEnd
          });
        }
        currentWord = '';
        if (i < chars.length - 1) {
          wordStart = startTimes[i + 1];
        }
      } else {
        if (currentWord === '') {
          wordStart = startTimes[i];
        }
        currentWord += char;
        wordEnd = endTimes[i];
      }
    }
  }
  
  job.subtitles = subtitles;
  job.totalDuration = subtitles.length > 0 ? subtitles[subtitles.length - 1].end : 15;
  
  console.log(`[Job ${job._id}] Voiceover: ${job.totalDuration}s, ${subtitles.length} subtitle words`);
  await job.save();
  return job;
}

/**
 * STEP 4: Render video with Shotstack
 */
async function renderVideo(job) {
  await updateJobStatus(job, 'rendering', 70, 'Rendering final video...');
  
  const audioDuration = job.totalDuration || 15;
  
  // Build video clips timeline
  const videoClips = [];
  let currentTime = 0;
  const clipDuration = audioDuration / job.scenes.length;
  
  for (let i = 0; i < job.scenes.length; i++) {
    const scene = job.scenes[i];
    videoClips.push({
      asset: {
        type: 'video',
        src: scene.videoUrl,
        trim: 0,
        volume: 0 // Mute original audio
      },
      start: currentTime,
      length: clipDuration,
      fit: 'cover',
      effect: 'zoomIn'
    });
    currentTime += clipDuration;
  }
  
  // Build subtitle clips (Shotstack HTML titles)
  const subtitleClips = [];
  
  // Group words into phrases (3-4 words each)
  const phrases = [];
  let currentPhrase = { words: [], start: 0, end: 0 };
  
  for (const sub of job.subtitles) {
    if (currentPhrase.words.length === 0) {
      currentPhrase.start = sub.start;
    }
    currentPhrase.words.push(sub.text);
    currentPhrase.end = sub.end;
    
    if (currentPhrase.words.length >= 4) {
      phrases.push({
        text: currentPhrase.words.join(' '),
        start: currentPhrase.start,
        end: currentPhrase.end
      });
      currentPhrase = { words: [], start: 0, end: 0 };
    }
  }
  
  // Don't forget last phrase
  if (currentPhrase.words.length > 0) {
    phrases.push({
      text: currentPhrase.words.join(' '),
      start: currentPhrase.start,
      end: currentPhrase.end
    });
  }
  
  // Create smooth subtitle clips - show phrase with current word in yellow
  // Group words into phrases for display (4-5 words each)
  const WORDS_PER_PHRASE = 5;
  const wordTimings = job.subtitles;
  const displayPhrases = [];
  
  for (let i = 0; i < wordTimings.length; i += WORDS_PER_PHRASE) {
    const phraseWords = wordTimings.slice(i, i + WORDS_PER_PHRASE);
    if (phraseWords.length > 0) {
      displayPhrases.push({
        words: phraseWords,
        start: phraseWords[0].start,
        end: phraseWords[phraseWords.length - 1].end
      });
    }
  }
  
  // For each phrase, create ONE clip that shows all words with the LAST word highlighted
  // This reduces blinking - phrase stays on screen for its full duration
  for (const phrase of displayPhrases) {
    // All words in white, last word in yellow (the "punch" word)
    const htmlWords = phrase.words.map((w, idx) => {
      if (idx === phrase.words.length - 1) {
        // Last word of phrase - YELLOW highlight
        return `<span style="color: #FFD700;">${w.text}</span>`;
      } else {
        // Other words - white
        return `<span style="color: white;">${w.text}</span>`;
      }
    }).join(' ');
    
    const html = `<div style="font-family: 'Montserrat', sans-serif; font-size: 56px; font-weight: 900; text-align: center; padding: 20px; text-shadow: 3px 3px 8px rgba(0,0,0,0.95), 0 0 15px rgba(0,0,0,0.7);">${htmlWords}</div>`;
    
    // Phrase stays on screen for its full duration
    const duration = phrase.end - phrase.start + 0.15; // Small overlap to prevent gaps
    
    subtitleClips.push({
      asset: {
        type: 'html',
        html: html,
        width: 1080,
        height: 200
      },
      start: phrase.start,
      length: duration,
      position: 'bottom',
      offset: { y: 0.12 }
    });
  }
  
  // Shotstack timeline
  const timeline = {
    background: '#000000',
    tracks: [
      { clips: subtitleClips }, // Top layer: subtitles
      { clips: videoClips }     // Bottom layer: video
    ]
  };
  
  // Add audio track
  timeline.tracks.push({
    clips: [{
      asset: {
        type: 'audio',
        src: job.audioUrl,
        volume: 1
      },
      start: 0,
      length: audioDuration
    }]
  });
  
  const renderPayload = {
    timeline,
    output: {
      format: 'mp4',
      resolution: 'hd',
      aspectRatio: '9:16',
      fps: 30
    }
  };
  
  // Submit to Shotstack
  const shotstackKey = process.env.SHOTSTACK_API_KEY;
  if (!shotstackKey) {
    throw new Error('SHOTSTACK_API_KEY not configured');
  }
  
  const shotstackEnv = process.env.SHOTSTACK_ENV || 'v1';
  const baseUrl = shotstackEnv === 'stage' 
    ? 'https://api.shotstack.io/stage'
    : 'https://api.shotstack.io/v1';
  
  console.log(`[Job ${job._id}] Submitting to Shotstack...`);
  console.log(`[Job ${job._id}] Video clips: ${videoClips.length}, Subtitle clips: ${subtitleClips.length}`);
  console.log(`[Job ${job._id}] Audio URL: ${job.audioUrl}`);
  console.log(`[Job ${job._id}] First video URL: ${videoClips[0]?.asset?.src}`);
  
  try {
    const renderResponse = await axios.post(
      `${baseUrl}/render`,
      renderPayload,
      {
        headers: {
          'x-api-key': shotstackKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    job.shotstackJobId = renderResponse.data.response.id;
    job.shotstackStatus = 'queued';
    await job.save();
    
    console.log(`[Job ${job._id}] Shotstack render queued: ${job.shotstackJobId}`);
  } catch (submitError) {
    console.error(`[Job ${job._id}] Shotstack submit error:`, submitError.response?.data || submitError.message);
    throw new Error(`Shotstack submit failed: ${submitError.response?.data?.message || submitError.message}`);
  }
  
  // Poll for completion
  await pollShotstackRender(job, baseUrl, shotstackKey);
  
  return job;
}

/**
 * Poll Shotstack until render is done
 */
async function pollShotstackRender(job, baseUrl, shotstackKey) {
  const maxAttempts = 60;
  const pollInterval = 3000;
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, pollInterval));
    
    const statusResponse = await axios.get(
      `${baseUrl}/render/${job.shotstackJobId}`,
      {
        headers: { 'x-api-key': shotstackKey }
      }
    );
    
    const responseData = statusResponse.data.response;
    const status = responseData.status;
    job.shotstackStatus = status;
    
    const progress = 70 + Math.min(25, i * 2); // 70% -> 95%
    await updateJobStatus(job, 'rendering', progress, `Rendering... ${status}`);
    
    console.log(`[Job ${job._id}] Shotstack poll ${i}: ${status}`);
    
    if (status === 'done') {
      job.finalVideoUrl = responseData.url;
      job.status = 'done';
      job.progress = 100;
      job.statusMessage = 'Complete!';
      job.completedAt = new Date();
      await job.save();
      console.log(`[Job ${job._id}] DONE: ${job.finalVideoUrl}`);
      return job;
    }
    
    if (status === 'failed') {
      // Get error details from Shotstack
      const errorMsg = responseData.error || 'Unknown render error';
      console.error(`[Job ${job._id}] Shotstack FAILED:`, JSON.stringify(responseData, null, 2));
      throw new Error(`Shotstack render failed: ${errorMsg}`);
    }
  }
  
  throw new Error('Shotstack render timeout');
}

/**
 * Update job status in database
 */
async function updateJobStatus(job, status, progress, message) {
  job.status = status;
  job.progress = progress;
  job.statusMessage = message;
  await job.save();
  console.log(`[Job ${job._id}] ${status}: ${message} (${progress}%)`);
}

/**
 * MAIN: Process a job through all steps
 */
async function processJob(jobId) {
  let job = await VideoJob.findById(jobId);
  if (!job) {
    console.error(`Job ${jobId} not found`);
    return;
  }
  
  try {
    console.log(`\n========== PROCESSING JOB ${jobId} ==========`);
    console.log(`Topic: ${job.topic}`);
    
    // Step 1: Generate script
    job = await generateScript(job);
    
    // Step 2: Find videos
    job = await findVideosForScenes(job);
    
    // Step 3: Generate voiceover
    job = await generateVoiceover(job);
    
    // Step 4: Render
    job = await renderVideo(job);
    
    console.log(`========== JOB ${jobId} COMPLETE ==========\n`);
    return job;
    
  } catch (error) {
    console.error(`[Job ${jobId}] FAILED:`, error.message);
    job.status = 'failed';
    job.error = error.message;
    await job.save();
    throw error;
  }
}

module.exports = {
  processJob,
  generateScript,
  findVideosForScenes,
  generateVoiceover,
  renderVideo
};
