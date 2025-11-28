const fs = require('fs');
const path = require('path');
const util = require('util');

/**
 * Google Cloud Text-to-Speech Service
 * Converts text to natural-sounding speech for Reels voiceovers
 */
class GoogleTTSService {
  constructor() {
    this.client = null;
    this.initialized = false;
    
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
  }

  _initClient() {
    if (this.initialized) return true;
    
    try {
      const textToSpeech = require('@google-cloud/text-to-speech');
      const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON 
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
        : null;

      this.client = credentials 
        ? new textToSpeech.TextToSpeechClient({ credentials })
        : new textToSpeech.TextToSpeechClient();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Google TTS:', error.message);
      return false;
    }
  }

  /**
   * Get list of available voices
   */
  async listVoices(languageCode = 'en-US') {
    try {
      if (!this._initClient()) {
        return { success: false, error: 'Google TTS not available' };
      }
      const [response] = await this.client.listVoices({ languageCode });
      
      const voices = response.voices.map(voice => ({
        name: voice.name,
        gender: voice.ssmlGender,
        languageCodes: voice.languageCodes,
        naturalSampleRateHertz: voice.naturalSampleRateHertz
      }));

      return { success: true, voices };
    } catch (error) {
      console.error('Google TTS list voices error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert
   * @param {object} options - Voice options
   */
  async textToSpeech(text, options = {}) {
    try {
      if (!this._initClient()) {
        return { success: false, error: 'Google TTS not available' };
      }
      const {
        languageCode = 'en-US',
        voiceName = 'en-US-Neural2-J', // Neural voice for natural sound
        ssmlGender = 'MALE',
        speakingRate = 1.0,
        pitch = 0,
        audioEncoding = 'MP3'
      } = options;

      console.log('🎤 Starting Google Text-to-Speech...');
      console.log('Text length:', text.length, 'characters');

      const request = {
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
          ssmlGender
        },
        audioConfig: {
          audioEncoding,
          speakingRate,
          pitch,
          effectsProfileId: ['headphone-class-device'] // Better audio quality
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);

      // Generate unique filename
      const filename = `tts_${Date.now()}.mp3`;
      const filePath = path.join(this.outputDir, filename);

      // Write audio to file
      const writeFile = util.promisify(fs.writeFile);
      await writeFile(filePath, response.audioContent, 'binary');

      console.log('✅ Audio saved to:', filePath);

      return {
        success: true,
        audioPath: filePath,
        filename: filename,
        audioUrl: `/uploads/audio/${filename}`
      };
    } catch (error) {
      console.error('Google TTS error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert text to speech with SSML for advanced control
   * @param {string} ssml - SSML formatted text
   * @param {object} options - Voice options
   */
  async ssmlToSpeech(ssml, options = {}) {
    try {
      if (!this._initClient()) {
        return { success: false, error: 'Google TTS not available' };
      }
      const {
        languageCode = 'en-US',
        voiceName = 'en-US-Neural2-J',
        ssmlGender = 'MALE',
        audioEncoding = 'MP3'
      } = options;

      console.log('🎤 Starting SSML Text-to-Speech...');

      const request = {
        input: { ssml },
        voice: {
          languageCode,
          name: voiceName,
          ssmlGender
        },
        audioConfig: {
          audioEncoding,
          effectsProfileId: ['headphone-class-device']
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);

      const filename = `tts_ssml_${Date.now()}.mp3`;
      const filePath = path.join(this.outputDir, filename);

      const writeFile = util.promisify(fs.writeFile);
      await writeFile(filePath, response.audioContent, 'binary');

      console.log('✅ SSML Audio saved to:', filePath);

      return {
        success: true,
        audioPath: filePath,
        filename: filename,
        audioUrl: `/uploads/audio/${filename}`
      };
    } catch (error) {
      console.error('Google TTS SSML error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate voiceover for Reel script
   * @param {string} script - The script text
   * @param {string} style - Voice style (energetic, calm, professional)
   */
  async generateVoiceover(script, style = 'energetic') {
    try {
      // Voice presets for different styles
      const stylePresets = {
        energetic: {
          voiceName: 'en-US-Neural2-D',
          speakingRate: 1.1,
          pitch: 2
        },
        calm: {
          voiceName: 'en-US-Neural2-J',
          speakingRate: 0.9,
          pitch: -2
        },
        professional: {
          voiceName: 'en-US-Neural2-F',
          speakingRate: 1.0,
          pitch: 0
        },
        friendly: {
          voiceName: 'en-US-Neural2-C',
          speakingRate: 1.05,
          pitch: 1
        }
      };

      const preset = stylePresets[style] || stylePresets.professional;

      return await this.textToSpeech(script, preset);
    } catch (error) {
      console.error('Generate voiceover error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recommended voices for Instagram content
   */
  getRecommendedVoices() {
    return {
      english: [
        { name: 'en-US-Neural2-D', gender: 'MALE', style: 'Energetic, great for Reels' },
        { name: 'en-US-Neural2-J', gender: 'MALE', style: 'Calm, professional' },
        { name: 'en-US-Neural2-C', gender: 'FEMALE', style: 'Friendly, approachable' },
        { name: 'en-US-Neural2-F', gender: 'FEMALE', style: 'Professional, authoritative' },
        { name: 'en-US-Studio-O', gender: 'FEMALE', style: 'Studio quality, natural' },
        { name: 'en-US-Studio-Q', gender: 'MALE', style: 'Studio quality, deep' }
      ],
      serbian: [
        { name: 'sr-RS-Standard-A', gender: 'FEMALE', style: 'Standard Serbian' }
      ],
      spanish: [
        { name: 'es-US-Neural2-A', gender: 'FEMALE', style: 'Latin American Spanish' },
        { name: 'es-US-Neural2-B', gender: 'MALE', style: 'Latin American Spanish' }
      ]
    };
  }
}

module.exports = new GoogleTTSService();
