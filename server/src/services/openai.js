const OpenAI = require('openai');

/**
 * OpenAI Service
 * For content generation, captions, hashtags, and more
 */
class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate Instagram caption from a topic/prompt
   */
  async generateCaption(topic, options = {}) {
    try {
      const { tone = 'engaging', includeEmojis = true, includeHashtags = true, language = 'en' } = options;

      const systemPrompt = `You are an expert Instagram content creator. Generate engaging captions that drive engagement.
      ${includeEmojis ? 'Include relevant emojis.' : 'Do not use emojis.'}
      ${includeHashtags ? 'Include 5-10 relevant hashtags at the end.' : 'Do not include hashtags.'}
      Tone: ${tone}
      Language: ${language === 'sr' ? 'Serbian' : 'English'}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create an Instagram caption about: ${topic}` }
        ],
        max_tokens: 500,
        temperature: 0.8
      });

      return {
        success: true,
        caption: response.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('OpenAI caption error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate hashtags for a topic
   */
  async generateHashtags(topic, count = 15) {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a hashtag expert. Generate ${count} relevant Instagram hashtags. 
            Mix popular and niche hashtags. Return ONLY hashtags separated by spaces, no other text.` 
          },
          { role: 'user', content: `Generate hashtags for: ${topic}` }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const hashtags = response.choices[0].message.content
        .trim()
        .split(/\s+/)
        .filter(h => h.startsWith('#'));

      return {
        success: true,
        hashtags: hashtags
      };
    } catch (error) {
      console.error('OpenAI hashtags error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate content ideas for Instagram
   */
  async generateContentIdeas(niche, count = 5) {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are an Instagram content strategist. Generate creative content ideas that will go viral.
            For each idea provide: title, type (reel/post/carousel), description, and suggested hook.
            You MUST respond with valid JSON in this exact format:
            {"ideas": [{"title": "...", "type": "reel", "description": "...", "hook": "..."}]}` 
          },
          { role: 'user', content: `Generate ${count} content ideas for the ${niche} niche. Return JSON only.` }
        ],
        max_tokens: 1500,
        temperature: 0.9
      });

      let content = response.choices[0].message.content;
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        content = jsonMatch[1].trim();
      }
      
      const ideas = JSON.parse(content);
      return {
        success: true,
        ideas: ideas.ideas || ideas
      };
    } catch (error) {
      console.error('OpenAI ideas error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate VIRAL video script for Reels
   * Uses proven viral formulas: Hook → Value → CTA
   */
  async generateReelScript(topic, duration = 9, context = {}) {
    try {
      // Calculate max words based on duration (2.5 words/second)
      const maxWords = Math.floor(duration * 2.5);
      
      // Build context-aware prompt
      const {
        businessName = '',
        businessType = '',
        targetAudience = '',
        brandTone = 'professional',
        hookStyle = 'question',
        contentGoal = 'engagement',
        topics = []
      } = context;
      
      const hookInstructions = {
        question: 'Start with a compelling question that makes viewers curious',
        statistic: 'Start with a shocking or surprising statistic',
        bold_claim: 'Start with a bold, controversial claim that grabs attention',
        story: 'Start with "I discovered..." or a mini story hook',
        problem: 'Start by calling out a common problem your audience has',
        curiosity: 'Start with "What if I told you..." or similar curiosity gap',
        stop_scroll: 'Start with "Stop scrolling" or "Wait" pattern interrupt',
        secret: 'Start with "The secret..." or "Nobody tells you this..."'
      };
      
      const goalInstructions = {
        engagement: 'Focus on getting comments and shares - ask questions, be relatable',
        followers: 'Focus on giving value so viewers want to follow for more',
        sales: 'Focus on pain points and hint at a solution (soft sell)',
        awareness: 'Focus on memorable brand messaging',
        education: 'Focus on teaching one valuable concept clearly',
        traffic: 'Tease valuable content and hint at more in bio',
        trust: 'Focus on credibility, expertise, and genuine value'
      };
      
      const toneInstructions = {
        professional: 'authoritative and credible',
        friendly: 'warm and approachable like a friend',
        inspirational: 'motivating and uplifting',
        humorous: 'witty and entertaining',
        educational: 'clear and informative',
        luxury: 'sophisticated and premium',
        casual: 'relatable and down-to-earth',
        bold: 'direct and provocative',
        empathetic: 'understanding and supportive'
      };

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert viral content creator who has studied MrBeast, Alex Hormozi, and top TikTok creators.

Write a ${duration}-second script (MAXIMUM ${maxWords} words) that WILL go viral.

${businessName ? `BRAND: ${businessName}` : ''}
${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}
TONE: ${toneInstructions[brandTone] || 'professional'}
HOOK STYLE: ${hookInstructions[hookStyle] || hookInstructions.question}
GOAL: ${goalInstructions[contentGoal] || goalInstructions.engagement}

${duration <= 9 ? `
SHORT FORMAT STRUCTURE (${duration} seconds):
1. HOOK (0-2 sec): ${hookInstructions[hookStyle]} - 4-5 words max
2. VALUE (2-7 sec): One powerful insight - 12-15 words
3. CTA (7-9 sec): Quick call to action - 3-4 words
` : `
LONGER FORMAT STRUCTURE:
1. HOOK (0-3 sec): ${hookInstructions[hookStyle]}
2. VALUE (3-12 sec): Deliver the promise
3. CTA (12-${duration} sec): Follow/Save call
`}

RULES:
- EXACTLY ${maxWords} words or fewer
- Write for SPEAKING, not reading
- Short punchy sentences
- Tone should be ${toneInstructions[brandTone] || 'professional'}
- NO timestamps, brackets, or stage directions
- Just the spoken words` 
          },
          { role: 'user', content: `Write a viral ${duration}-second Reel script about: ${topics.length > 0 ? topics[Math.floor(Math.random() * topics.length)] : topic}` }
        ],
        max_tokens: 150,
        temperature: 0.9
      });

      return {
        success: true,
        script: response.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('OpenAI script error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze and improve existing caption
   */
  async improveCaption(caption) {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are an Instagram optimization expert. Improve captions for better engagement.
            Make it more engaging, add a hook, improve CTA, suggest better hashtags.` 
          },
          { role: 'user', content: `Improve this caption:\n\n${caption}` }
        ],
        max_tokens: 600,
        temperature: 0.7
      });

      return {
        success: true,
        improvedCaption: response.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('OpenAI improve error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate video prompt for AI video generation (optimized for Kling/Replicate)
   */
  async generateVideoPrompt(topic, style = 'cinematic') {
    try {
      const styleGuides = {
        cinematic: 'dramatic lighting, film grain, wide shots, slow motion, epic feel, 4K quality',
        energetic: 'fast cuts, vibrant colors, dynamic movement, high energy, pop aesthetic',
        minimal: 'clean background, soft lighting, simple composition, modern, aesthetic',
        luxury: 'gold accents, marble textures, elegant, high-end, sophisticated lighting',
        nature: 'natural lighting, outdoor scenery, organic textures, peaceful, serene',
        tech: 'neon lights, futuristic, digital effects, cyberpunk aesthetic, blue tones',
        vintage: 'warm tones, film grain, retro aesthetic, nostalgic, golden hour'
      };
      
      const styleGuide = styleGuides[style] || styleGuides.cinematic;
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert at writing prompts for AI video generation (Kling AI).

Create a prompt that will generate an ENGAGING vertical video (9:16 aspect ratio).

Style requirements: ${styleGuide}

PROMPT STRUCTURE:
1. Main subject/action (what's happening)
2. Visual style (${style})
3. Camera movement (slow zoom, pan, static, etc.)
4. Lighting and mood
5. Always end with: "vertical format, 9:16 aspect ratio, high quality, smooth motion"

Keep it under 80 words. No line breaks. Be specific and visual.` 
          },
          { role: 'user', content: `Create a video prompt for ${topic} content` }
        ],
        max_tokens: 200,
        temperature: 0.85
      });

      return {
        success: true,
        prompt: response.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('OpenAI video prompt error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Chat with AI assistant
   * @param {string|Array} message - Either a string message or array of message objects
   * @param {Array} conversationHistory - Previous conversation (only used if message is string)
   */
  async chat(message, conversationHistory = []) {
    try {
      let messages;
      
      // Handle both string and array inputs
      if (Array.isArray(message)) {
        // Direct array of messages passed
        messages = message;
      } else {
        // String message with optional history
        messages = [
          { 
            role: 'system', 
            content: `You are an Instagram marketing expert assistant. Help users with:
            - Content strategy
            - Caption writing
            - Hashtag research
            - Engagement tips
            - Growth strategies
            - Reel ideas
            Be helpful, concise, and actionable.` 
          },
          ...conversationHistory,
          { role: 'user', content: message }
        ];
      }

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      });

      return {
        success: true,
        response: response.choices[0].message.content.trim(),
        content: response.choices[0].message.content.trim() // Alias for compatibility
      };
    } catch (error) {
      console.error('OpenAI chat error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new OpenAIService();
