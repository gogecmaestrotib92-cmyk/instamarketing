/**
 * Automatic Subtitle Generator Service
 * Generates timed captions/subtitles from text for TTS audio
 * Estimates word timings based on speaking rate and syllable count
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SubtitleGenerator {
  constructor() {
    // Average speaking rates (words per minute)
    this.speakingRates = {
      slow: 120,
      normal: 150,
      fast: 180,
      energetic: 170,
      calm: 130,
      professional: 145,
      friendly: 155
    };

    // Output directory for subtitle files
    this.outputDir = path.join(__dirname, '../../uploads/subtitles');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Estimate syllable count for a word (rough approximation)
   */
  countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    
    // Count vowel groups
    const vowels = word.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 1;
    
    // Adjust for silent e
    if (word.endsWith('e') && count > 1) count--;
    
    // Adjust for common endings
    if (word.endsWith('le') && word.length > 2 && !/[aeiouy]/.test(word[word.length - 3])) count++;
    
    return Math.max(1, count);
  }

  /**
   * Calculate word duration based on syllables and speaking rate
   */
  calculateWordDuration(word, wordsPerMinute = 150) {
    const syllables = this.countSyllables(word);
    const baseTimePerWord = 60 / wordsPerMinute; // seconds per word
    const syllableFactor = syllables / 2; // Average word has ~2 syllables
    return baseTimePerWord * syllableFactor;
  }

  /**
   * Generate word-level timings from text
   * @param {string} text - The full text/script
   * @param {string} style - Speaking style (affects speed)
   * @param {number} startTime - Start time offset in seconds
   */
  generateWordTimings(text, style = 'normal', startTime = 0) {
    const wpm = this.speakingRates[style] || this.speakingRates.normal;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const timings = [];
    let currentTime = startTime;

    for (const word of words) {
      const duration = this.calculateWordDuration(word, wpm);
      timings.push({
        word: word,
        start: Math.round(currentTime * 1000) / 1000,
        end: Math.round((currentTime + duration) * 1000) / 1000,
        duration: Math.round(duration * 1000) / 1000
      });
      currentTime += duration;
      
      // Add small pause after punctuation
      if (/[.!?]$/.test(word)) {
        currentTime += 0.3; // 300ms pause after sentences
      } else if (/[,;:]$/.test(word)) {
        currentTime += 0.15; // 150ms pause after commas
      }
    }

    return {
      timings,
      totalDuration: Math.round(currentTime * 1000) / 1000,
      wordCount: words.length,
      wordsPerMinute: wpm
    };
  }

  /**
   * Generate sentence-level captions (better for readability)
   * @param {string} text - The full text/script
   * @param {string} style - Speaking style
   * @param {number} maxWordsPerCaption - Maximum words per caption segment
   */
  generateSentenceCaptions(text, style = 'normal', maxWordsPerCaption = 8) {
    const wpm = this.speakingRates[style] || this.speakingRates.normal;
    
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const captions = [];
    let currentTime = 0;

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
      
      // Split long sentences into chunks
      for (let i = 0; i < words.length; i += maxWordsPerCaption) {
        const chunk = words.slice(i, i + maxWordsPerCaption);
        const chunkText = chunk.join(' ');
        
        // Calculate duration for this chunk
        let chunkDuration = 0;
        for (const word of chunk) {
          chunkDuration += this.calculateWordDuration(word, wpm);
        }
        
        // Add pause at end of sentence
        const isEndOfSentence = i + maxWordsPerCaption >= words.length;
        if (isEndOfSentence) {
          chunkDuration += 0.3;
        }

        captions.push({
          text: chunkText,
          start: Math.round(currentTime * 1000) / 1000,
          end: Math.round((currentTime + chunkDuration) * 1000) / 1000,
          duration: Math.round(chunkDuration * 1000) / 1000
        });

        currentTime += chunkDuration;
      }
    }

    return {
      captions,
      totalDuration: Math.round(currentTime * 1000) / 1000,
      captionCount: captions.length
    };
  }

  /**
   * Generate karaoke-style word-by-word captions
   * Each word appears one at a time
   */
  generateKaraokeCaptions(text, style = 'normal') {
    const wordTimings = this.generateWordTimings(text, style);
    
    return {
      captions: wordTimings.timings.map(t => ({
        text: t.word,
        start: t.start,
        end: t.end
      })),
      totalDuration: wordTimings.totalDuration,
      style: 'karaoke'
    };
  }

  /**
   * Generate highlighted word captions (full sentence with current word highlighted)
   * Great for TikTok/Reels style
   */
  generateHighlightedCaptions(text, style = 'normal', wordsPerLine = 5) {
    const wordTimings = this.generateWordTimings(text, style);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const captions = [];

    // Group words into lines
    for (let lineStart = 0; lineStart < words.length; lineStart += wordsPerLine) {
      const lineWords = words.slice(lineStart, lineStart + wordsPerLine);
      const lineTimings = wordTimings.timings.slice(lineStart, lineStart + wordsPerLine);
      
      // Create caption for each word in the line
      for (let i = 0; i < lineWords.length; i++) {
        const timing = lineTimings[i];
        
        // Build text with highlighted word
        const highlightedText = lineWords.map((w, idx) => 
          idx === i ? `**${w}**` : w
        ).join(' ');

        captions.push({
          text: highlightedText,
          plainText: lineWords.join(' '),
          highlightedWord: lineWords[i],
          highlightIndex: i,
          start: timing.start,
          end: timing.end
        });
      }
    }

    return {
      captions,
      totalDuration: wordTimings.totalDuration,
      style: 'highlighted'
    };
  }

  /**
   * Generate SRT subtitle file
   */
  generateSRT(captions, filename = null) {
    const srtFilename = filename || `subtitles_${uuidv4()}.srt`;
    const filePath = path.join(this.outputDir, srtFilename);
    
    let srtContent = '';
    
    captions.forEach((caption, index) => {
      const startTime = this.formatSRTTime(caption.start);
      const endTime = this.formatSRTTime(caption.end);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${caption.text}\n\n`;
    });

    fs.writeFileSync(filePath, srtContent, 'utf8');
    
    return {
      success: true,
      filePath,
      filename: srtFilename,
      url: `/uploads/subtitles/${srtFilename}`
    };
  }

  /**
   * Generate VTT subtitle file (WebVTT format)
   */
  generateVTT(captions, filename = null) {
    const vttFilename = filename || `subtitles_${uuidv4()}.vtt`;
    const filePath = path.join(this.outputDir, vttFilename);
    
    let vttContent = 'WEBVTT\n\n';
    
    captions.forEach((caption, index) => {
      const startTime = this.formatVTTTime(caption.start);
      const endTime = this.formatVTTTime(caption.end);
      
      vttContent += `${index + 1}\n`;
      vttContent += `${startTime} --> ${endTime}\n`;
      vttContent += `${caption.text}\n\n`;
    });

    fs.writeFileSync(filePath, vttContent, 'utf8');
    
    return {
      success: true,
      filePath,
      filename: vttFilename,
      url: `/uploads/subtitles/${vttFilename}`
    };
  }

  /**
   * Generate JSON captions (for Shotstack, FFmpeg, etc.)
   */
  generateJSON(captions, filename = null) {
    const jsonFilename = filename || `subtitles_${uuidv4()}.json`;
    const filePath = path.join(this.outputDir, jsonFilename);
    
    fs.writeFileSync(filePath, JSON.stringify(captions, null, 2), 'utf8');
    
    return {
      success: true,
      filePath,
      filename: jsonFilename,
      url: `/uploads/subtitles/${jsonFilename}`,
      captions
    };
  }

  /**
   * Format time for SRT (00:00:00,000)
   */
  formatSRTTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Format time for VTT (00:00:00.000)
   */
  formatVTTTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Full subtitle generation workflow
   * Returns captions in multiple formats
   */
  async generateSubtitles(text, options = {}) {
    const {
      style = 'normal',
      format = 'sentence', // 'sentence', 'word', 'karaoke', 'highlighted'
      maxWordsPerCaption = 6,
      wordsPerLine = 5,
      outputFormats = ['json', 'srt', 'vtt']
    } = options;

    let captionData;

    switch (format) {
      case 'word':
        captionData = this.generateWordTimings(text, style);
        captionData.captions = captionData.timings.map(t => ({
          text: t.word,
          start: t.start,
          end: t.end
        }));
        break;
      
      case 'karaoke':
        captionData = this.generateKaraokeCaptions(text, style);
        break;
      
      case 'highlighted':
        captionData = this.generateHighlightedCaptions(text, style, wordsPerLine);
        break;
      
      case 'sentence':
      default:
        captionData = this.generateSentenceCaptions(text, style, maxWordsPerCaption);
        break;
    }

    const result = {
      success: true,
      captions: captionData.captions,
      totalDuration: captionData.totalDuration,
      captionCount: captionData.captions.length,
      format,
      style,
      files: {}
    };

    // Generate output files
    const baseFilename = `sub_${uuidv4()}`;
    
    if (outputFormats.includes('json')) {
      result.files.json = this.generateJSON(captionData.captions, `${baseFilename}.json`);
    }
    
    if (outputFormats.includes('srt')) {
      result.files.srt = this.generateSRT(captionData.captions, `${baseFilename}.srt`);
    }
    
    if (outputFormats.includes('vtt')) {
      result.files.vtt = this.generateVTT(captionData.captions, `${baseFilename}.vtt`);
    }

    return result;
  }

  /**
   * Generate FFmpeg drawtext filter for burned-in subtitles
   */
  generateFFmpegFilter(captions, options = {}) {
    const {
      fontSize = 24,
      fontColor = 'white',
      backgroundColor = 'black@0.6',
      position = 'bottom', // 'top', 'center', 'bottom'
      fontFile = null,
      boxPadding = 10
    } = options;

    // Calculate Y position
    let yPos;
    switch (position) {
      case 'top':
        yPos = '50';
        break;
      case 'center':
        yPos = '(h-text_h)/2';
        break;
      case 'bottom':
      default:
        yPos = 'h-text_h-50';
    }

    const filters = captions.map((caption, index) => {
      const escapedText = caption.text
        .replace(/'/g, "'\\''")
        .replace(/:/g, '\\:')
        .replace(/\\/g, '\\\\');
      
      return `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=${backgroundColor}:boxborderw=${boxPadding}:enable='between(t,${caption.start},${caption.end})'`;
    });

    return filters.join(',');
  }

  /**
   * Generate ASS/SSA subtitle file (Advanced SubStation Alpha)
   * Supports styling, colors, and animations
   */
  generateASS(captions, options = {}) {
    const {
      fontName = 'Arial',
      fontSize = 24,
      primaryColor = '&H00FFFFFF', // White
      outlineColor = '&H00000000', // Black
      backColor = '&H80000000', // Semi-transparent black
      bold = true,
      outline = 2,
      shadow = 1,
      alignment = 2, // Bottom center
      marginV = 30
    } = options;

    const filename = `subtitles_${uuidv4()}.ass`;
    const filePath = path.join(this.outputDir, filename);

    let assContent = `[Script Info]
Title: Auto-generated Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,${outlineColor},${backColor},${bold ? -1 : 0},0,0,0,100,100,0,0,1,${outline},${shadow},${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    captions.forEach(caption => {
      const startTime = this.formatASSTime(caption.start);
      const endTime = this.formatASSTime(caption.end);
      assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${caption.text}\n`;
    });

    fs.writeFileSync(filePath, assContent, 'utf8');

    return {
      success: true,
      filePath,
      filename,
      url: `/uploads/subtitles/${filename}`
    };
  }

  /**
   * Format time for ASS (0:00:00.00)
   */
  formatASSTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const cs = Math.round((seconds % 1) * 100); // Centiseconds
    
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }
}

module.exports = new SubtitleGenerator();
