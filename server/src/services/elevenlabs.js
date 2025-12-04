const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Import Cloudinary for cloud audio storage
let uploadToCloudinary = null;
try {
  const cloudinaryModule = require('./cloudinary');
  uploadToCloudinary = cloudinaryModule.uploadToCloudinary;
  console.log('✅ Cloudinary loaded for ElevenLabs audio uploads');
} catch (e) {
  console.log('Cloudinary not available for ElevenLabs:', e.message);
}

/**
 * ElevenLabs Text-to-Speech Service
 * Premium AI voices for professional voiceovers
 */
class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.initialized = !!this.apiKey;
    
    // Use /tmp on Vercel, otherwise local uploads
    const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const baseDir = isVercel ? '/tmp' : path.join(__dirname, '../../uploads');
    this.outputDir = path.join(baseDir, 'audio');
    
    // Ensure output directory exists
    try {
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
    } catch (e) { 
      console.log('Audio dir creation skipped'); 
    }
    
    if (this.initialized) {
      console.log('✅ ElevenLabs service initialized');
    } else {
      console.log('⚠️ ElevenLabs API key not found - service disabled');
    }
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.initialized;
  }

  /**
   * Get list of available voices
   */
  async getVoices() {
    if (!this.initialized) {
      return { success: false, error: 'ElevenLabs API key not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      
      const voices = data.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        labels: voice.labels,
        previewUrl: voice.preview_url
      }));

      return { success: true, voices };
    } catch (error) {
      console.error('ElevenLabs get voices error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recommended voices for different use cases
   */
  getRecommendedVoices() {
    return [
      {
        id: 'EXAVITQu4vr4xnSDxMaL', // Sarah
        name: 'Sarah',
        style: 'professional',
        description: 'Clear, professional female voice - great for business content',
        category: 'premade'
      },
      {
        id: 'pNInz6obpgDQGcFmaJgB', // Adam
        name: 'Adam',
        style: 'narration',
        description: 'Deep, authoritative male voice - perfect for narration',
        category: 'premade'
      },
      {
        id: '21m00Tcm4TlvDq8ikWAM', // Rachel
        name: 'Rachel',
        style: 'conversational',
        description: 'Warm, friendly female voice - ideal for social media',
        category: 'premade'
      },
      {
        id: 'AZnzlk1XvdvUeBnXmlld', // Domi
        name: 'Domi',
        style: 'energetic',
        description: 'Energetic young female voice - great for exciting content',
        category: 'premade'
      },
      {
        id: 'MF3mGyEYCl7XYWbV9V6O', // Elli
        name: 'Elli',
        style: 'youthful',
        description: 'Youthful female voice - perfect for Gen Z content',
        category: 'premade'
      },
      {
        id: 'TxGEqnHWrfWFTfGW9XjX', // Josh
        name: 'Josh',
        style: 'dynamic',
        description: 'Dynamic young male voice - energetic and engaging',
        category: 'premade'
      },
      {
        id: 'VR6AewLTigWG4xSOukaG', // Arnold
        name: 'Arnold',
        style: 'dramatic',
        description: 'Deep dramatic male voice - cinematic feel',
        category: 'premade'
      },
      {
        id: 'pqHfZKP75CvOlQylNhV4', // Bill
        name: 'Bill',
        style: 'trustworthy',
        description: 'Trustworthy male voice - documentary style',
        category: 'premade'
      },
      {
        id: 'nPczCjzI2devNBz1zQrb', // Brian
        name: 'Brian',
        style: 'deep',
        description: 'Deep, rich male voice - great for luxury brands',
        category: 'premade'
      },
      {
        id: 'onwK4e9ZLuTAKqWW03F9', // Daniel
        name: 'Daniel',
        style: 'british',
        description: 'British male voice - sophisticated and refined',
        category: 'premade'
      }
    ];
  }

  /**
   * Text to Speech conversion
   * @param {string} text - Text to convert to speech
   * @param {object} options - TTS options
   * @returns {Promise<object>} - Result with audio URL
   */
  async textToSpeech(text, options = {}) {
    if (!this.initialized) {
      return { success: false, error: 'ElevenLabs API key not configured' };
    }

    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Text is required' };
    }

    try {
      const voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default to Rachel
      const modelId = options.modelId || 'eleven_multilingual_v2';
      
      // Voice settings for natural speech
      const voiceSettings = {
        stability: options.stability || 0.5,
        similarity_boost: options.similarityBoost || 0.75,
        style: options.style || 0.5,
        use_speaker_boost: options.speakerBoost !== false
      };

      console.log(`🎤 ElevenLabs TTS: Converting ${text.length} chars with voice ${voiceId}`);

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: voiceSettings
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail?.message || `API error: ${response.status}`);
      }

      // Get audio buffer
      const audioBuffer = await response.buffer();
      
      // Generate filename
      const timestamp = Date.now();
      const filename = `elevenlabs_${timestamp}.mp3`;
      const localPath = path.join(this.outputDir, filename);

      // Save locally first
      fs.writeFileSync(localPath, audioBuffer);
      console.log(`🎤 Audio saved locally: ${localPath}`);

      // Upload to Cloudinary for cloud access
      let cloudUrl = null;
      if (uploadToCloudinary) {
        try {
          const uploadResult = await uploadToCloudinary(localPath, {
            resource_type: 'video', // Cloudinary uses 'video' for audio
            folder: 'instamarketing/voiceovers'
          });
          
          if (uploadResult.success) {
            cloudUrl = uploadResult.url;
            console.log(`☁️ Audio uploaded to Cloudinary: ${cloudUrl}`);
            
            // Clean up local file after successful upload
            try { fs.unlinkSync(localPath); } catch (e) {}
          }
        } catch (uploadError) {
          console.error('Cloudinary upload failed:', uploadError.message);
        }
      }

      return {
        success: true,
        audioUrl: cloudUrl || localPath,
        localPath: localPath,
        duration: null, // ElevenLabs doesn't return duration in basic endpoint
        voiceId: voiceId,
        model: modelId
      };

    } catch (error) {
      console.error('ElevenLabs TTS error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Text to Speech WITH TIMESTAMPS - Returns exact word timings!
   * Uses ElevenLabs streaming endpoint with timing data
   * @param {string} text - Text to convert
   * @param {object} options - TTS options including voiceId
   * @returns {Promise<object>} - Result with audio URL AND word timestamps
   */
  async textToSpeechWithTimestamps(text, options = {}) {
    if (!this.initialized) {
      return { success: false, error: 'ElevenLabs API key not configured' };
    }

    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Text is required' };
    }

    try {
      const voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM';
      const modelId = options.modelId || 'eleven_multilingual_v2';
      
      const voiceSettings = {
        stability: options.stability || 0.5,
        similarity_boost: options.similarityBoost || 0.75,
        style: options.style || 0.5,
        use_speaker_boost: options.speakerBoost !== false
      };

      console.log(`🎤 ElevenLabs TTS with Timestamps: Converting ${text.length} chars`);

      // Use the streaming endpoint with timestamps
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}/with-timestamps`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: voiceSettings
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`⚠️ Timestamps endpoint failed (${response.status}), falling back to basic TTS`);
        // Fallback to regular TTS
        return this.textToSpeech(text, options);
      }

      const data = await response.json();
      
      // Extract audio (base64) and timestamps
      const audioBase64 = data.audio_base64;
      const alignment = data.alignment; // Contains character-level timing
      
      if (!audioBase64) {
        console.log('⚠️ No audio in response, falling back to basic TTS');
        return this.textToSpeech(text, options);
      }

      // Convert base64 to buffer and save
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const timestamp = Date.now();
      const filename = `elevenlabs_ts_${timestamp}.mp3`;
      const localPath = path.join(this.outputDir, filename);
      fs.writeFileSync(localPath, audioBuffer);

      // Parse timestamps into word-level timings
      const wordTimings = this.parseAlignmentToWords(text, alignment);
      const audioDuration = wordTimings.length > 0 ? wordTimings[wordTimings.length - 1].end : null;

      console.log(`🎤 Got ${wordTimings.length} word timings, duration: ${audioDuration?.toFixed(2)}s`);

      // Upload to Cloudinary
      let cloudUrl = null;
      if (uploadToCloudinary) {
        try {
          const uploadResult = await uploadToCloudinary(localPath, {
            resource_type: 'video',
            folder: 'instamarketing/voiceovers'
          });
          if (uploadResult.success) {
            cloudUrl = uploadResult.url;
            try { fs.unlinkSync(localPath); } catch (e) {}
          }
        } catch (e) {
          console.log('Cloudinary upload failed:', e.message);
        }
      }

      return {
        success: true,
        audioUrl: cloudUrl || localPath,
        localPath: localPath,
        duration: audioDuration,
        voiceId: voiceId,
        model: modelId,
        wordTimings: wordTimings, // EXACT word-level timestamps!
        hasTimestamps: true
      };

    } catch (error) {
      console.error('ElevenLabs TTS with timestamps error:', error.message);
      // Fallback to basic TTS
      return this.textToSpeech(text, options);
    }
  }

  /**
   * Parse ElevenLabs alignment data into word-level timings
   */
  parseAlignmentToWords(text, alignment) {
    if (!alignment || !alignment.characters || !alignment.character_start_times_seconds) {
      return [];
    }

    const chars = alignment.characters;
    const charStarts = alignment.character_start_times_seconds;
    const charEnds = alignment.character_end_times_seconds || [];

    const words = [];
    let currentWord = '';
    let wordStart = null;
    let wordEnd = 0;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const start = charStarts[i];
      const end = charEnds[i] || (charStarts[i + 1] || start + 0.1);

      if (char === ' ' || char === '\n') {
        // End of word
        if (currentWord.trim()) {
          words.push({
            word: currentWord.trim(),
            start: wordStart,
            end: wordEnd
          });
        }
        currentWord = '';
        wordStart = null;
      } else {
        if (wordStart === null) {
          wordStart = start;
        }
        currentWord += char;
        wordEnd = end;
      }
    }

    // Don't forget the last word
    if (currentWord.trim()) {
      words.push({
        word: currentWord.trim(),
        start: wordStart,
        end: wordEnd
      });
    }

    return words;
  }

  /**
   * Generate voiceover with style presets
   * @param {string} script - The script to speak
   * @param {string} style - Style preset (energetic, calm, professional, etc.)
   * @returns {Promise<object>} - Result with audio URL
   */
  async generateVoiceover(script, style = 'energetic') {
    // Map styles to voice IDs and settings
    const stylePresets = {
      energetic: {
        voiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi
        stability: 0.4,
        similarityBoost: 0.8,
        style: 0.7
      },
      calm: {
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
        stability: 0.7,
        similarityBoost: 0.7,
        style: 0.3
      },
      professional: {
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
        stability: 0.6,
        similarityBoost: 0.75,
        style: 0.4
      },
      dramatic: {
        voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold
        stability: 0.5,
        similarityBoost: 0.85,
        style: 0.8
      },
      conversational: {
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.5
      },
      narrator: {
        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
        stability: 0.6,
        similarityBoost: 0.8,
        style: 0.4
      },
      youthful: {
        voiceId: 'MF3mGyEYCl7XYWbV9V6O', // Elli
        stability: 0.45,
        similarityBoost: 0.75,
        style: 0.6
      },
      luxury: {
        voiceId: 'nPczCjzI2devNBz1zQrb', // Brian
        stability: 0.65,
        similarityBoost: 0.8,
        style: 0.35
      },
      british: {
        voiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel
        stability: 0.55,
        similarityBoost: 0.8,
        style: 0.45
      },
      dynamic: {
        voiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh
        stability: 0.4,
        similarityBoost: 0.8,
        style: 0.7
      }
    };

    const preset = stylePresets[style] || stylePresets.energetic;

    return this.textToSpeech(script, {
      voiceId: preset.voiceId,
      stability: preset.stability,
      similarityBoost: preset.similarityBoost,
      style: preset.style
    });
  }

  /**
   * Get subscription/usage info
   */
  async getSubscriptionInfo() {
    if (!this.initialized) {
      return { success: false, error: 'ElevenLabs API key not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/user/subscription`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        subscription: {
          tier: data.tier,
          characterCount: data.character_count,
          characterLimit: data.character_limit,
          canExtendCharacterLimit: data.can_extend_character_limit,
          nextCharacterCountResetUnix: data.next_character_count_reset_unix
        }
      };
    } catch (error) {
      console.error('ElevenLabs subscription error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const elevenlabsService = new ElevenLabsService();
module.exports = elevenlabsService;
