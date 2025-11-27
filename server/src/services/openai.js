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
   * Generate video script for Reels
   */
  async generateReelScript(topic, duration = 30) {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a viral Reels scriptwriter. Create engaging ${duration}-second video scripts.
            Include: hook (first 3 seconds), main content, call-to-action.
            Format with timestamps and visual directions.` 
          },
          { role: 'user', content: `Write a Reel script about: ${topic}` }
        ],
        max_tokens: 800,
        temperature: 0.8
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
   * Generate video prompt for AI video generation
   */
  async generateVideoPrompt(topic, style = 'cinematic') {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are an AI video prompt engineer. Create detailed, descriptive prompts for AI video generation.
            Style: ${style}
            Include: scene description, lighting, camera movement, mood, colors.
            Be specific and visual. One paragraph, no line breaks.` 
          },
          { role: 'user', content: `Create a video prompt for: ${topic}` }
        ],
        max_tokens: 300,
        temperature: 0.8
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
   */
  async chat(message, conversationHistory = []) {
    try {
      const messages = [
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

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      });

      return {
        success: true,
        response: response.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('OpenAI chat error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new OpenAIService();
