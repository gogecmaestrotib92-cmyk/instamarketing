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
      
      // Detect content type from topic prefix (e.g., "story: business growth")
      const contentTypeMatch = topic.match(/^(tips|facts|quotes|story|tutorial|motivation):\s*/i);
      const contentType = contentTypeMatch ? contentTypeMatch[1].toLowerCase() : null;
      const cleanTopic = contentType ? topic.replace(/^[^:]+:\s*/, '') : topic;
      
      // Content type specific instructions
      const contentTypeInstructions = {
        tips: 'Structure as actionable tips. Use numbered format (1, 2, 3) if multiple tips. Be practical and immediately useful.',
        facts: 'Present surprising or little-known facts. Use phrases like "Did you know..." or "Here\'s something crazy...". Make it educational but entertaining.',
        quotes: 'Center around an inspiring quote or wisdom. Include the quote and add your perspective. Make it thought-provoking.',
        story: 'Tell a compelling story with a beginning, middle, and end. Use narrative techniques like "I was...", "Then something changed...". Be personal and relatable.',
        tutorial: 'Teach one specific skill or concept step-by-step. Use clear instructions like "First...", "Next...", "Finally...". Be educational.',
        motivation: 'Be inspiring and empowering. Use powerful language that sparks action. Include a call to believe in oneself or take action.'
      };
      
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
${contentType ? `CONTENT FORMAT: ${contentType.toUpperCase()} - ${contentTypeInstructions[contentType]}` : ''}

${duration <= 9 ? `
SHORT FORMAT STRUCTURE (${duration} seconds):
1. HOOK (0-2 sec): ${hookInstructions[hookStyle]} - 4-5 words max
2. VALUE (2-7 sec): One powerful insight - 12-15 words
3. CTA (7-9 sec): Quick call to action - 3-4 words
` : `
LONGER FORMAT STRUCTURE:
1. HOOK (0-3 sec): ${hookInstructions[hookStyle]}
2. VALUE (3-${Math.floor(duration * 0.8)} sec): Deliver the promise
3. CTA (${Math.floor(duration * 0.8)}-${duration} sec): Follow/Save call
`}

RULES:
- EXACTLY ${maxWords} words or fewer
- Write for SPEAKING, not reading
- Short punchy sentences
- Tone should be ${toneInstructions[brandTone] || 'professional'}
- NO timestamps, brackets, or stage directions
- Just the spoken words` 
          },
          { role: 'user', content: `Write a viral ${duration}-second ${contentType || 'Reel'} script about: ${cleanTopic}` }
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
   * Generate video script WITH visual scene descriptions
   * Each sentence gets a matching video search term for stock footage
   */
  async generateScriptWithScenes(topic, duration = 15, contentType = 'tips') {
    try {
      const maxWords = Math.floor(duration * 2.5);
      const numScenes = Math.min(5, Math.max(3, Math.ceil(duration / 5)));
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a viral video script writer who creates scripts with PERFECTLY matched visual scenes.

Create a ${duration}-second script with ${numScenes} scenes. For each scene, provide:
1. The spoken text (short, punchy)
2. A SPECIFIC video search term (2-4 words) that VISUALLY MATCHES the narration

RESPOND IN THIS EXACT JSON FORMAT:
{
  "script": "Full spoken script here",
  "scenes": [
    {"text": "Hook sentence", "video": "specific visual action"},
    {"text": "Value point", "video": "specific visual action"}
  ]
}

=== CRITICAL VIDEO MATCHING RULES ===

The video search term MUST show what the narrator is TALKING ABOUT at that exact moment.

EXAMPLES OF PERFECT MATCHING:
| Narration | Video Search Term |
|-----------|------------------|
| "Want flat abs?" | "person showing abs muscles" |
| "Drink more water" | "person drinking water bottle" |
| "Get enough sleep" | "person sleeping peacefully bed" |
| "Here's how" | "person pointing explaining" |
| "Start your morning right" | "person waking up stretching sunrise" |
| "Most people fail because..." | "person frustrated confused" |
| "The key is consistency" | "person training gym daily routine" |
| "Reduce stress" | "person meditating relaxing" |
| "Eat clean foods" | "healthy food salad vegetables" |
| "Build muscle fast" | "muscular person lifting weights" |
| "Stop wasting time" | "clock time passing" |
| "Make money online" | "laptop money success" |
| "Save thousands" | "money cash savings" |

=== WHAT TO AVOID ===
❌ NEVER use abstract words: "success", "motivation", "consistency", "discipline", "results", "mindset"
❌ NEVER use vague terms: "journey", "process", "key", "secret", "tip", "hack"
❌ NEVER mismatch: If talking about water, don't show gym equipment

=== CONTENT TYPE SPECIFIC ===
${contentType === 'fitness' ? `
For FITNESS topics, ALWAYS use specific exercise visuals:
- "crunches" → "person doing crunches gym"
- "plank" → "person holding plank position"
- "running" → "person running outdoor jogging"
- "diet" → "healthy meal food plate"
- "abs" → "fit person showing abs"
` : ''}
${contentType === 'motivation' ? `
For MOTIVATION topics, show PEOPLE DOING THINGS:
- Goals → "person achieving celebration"
- Hard work → "person working determined focus"
- Success → "businessman celebrating success"
- Never give up → "athlete pushing through exhausted"
` : ''}
${contentType === 'business' ? `
For BUSINESS topics, use professional imagery:
- Money → "money cash dollars growing"
- Work → "professional laptop office"
- Success → "business handshake deal"
- Growth → "graph chart upward growth"
` : ''}

Script rules:
- Maximum ${maxWords} words total
- Short punchy sentences (5-8 words each)
- Start with an attention-grabbing hook
- End with a clear CTA
- Write for SPEAKING, not reading` 
          },
          { role: 'user', content: `Create a ${contentType} video about: ${topic}` }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const content = response.choices[0].message.content.trim();
      
      // Try to parse as JSON
      try {
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = content;
        if (content.includes('```')) {
          jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }
        
        const parsed = JSON.parse(jsonStr);
        console.log('   ✅ Parsed script with scenes:', parsed.scenes?.length || 0, 'scenes');
        
        // Validate and improve scene video terms
        if (parsed.scenes && parsed.scenes.length > 0) {
          parsed.scenes = parsed.scenes.map((scene, i) => {
            let videoTerm = scene.video || '';
            
            // Replace any abstract terms that slipped through
            const abstractTerms = ['consistency', 'motivation', 'success', 'discipline', 'results', 'mindset', 'focus', 'journey', 'process', 'key', 'secret', 'tip', 'hack', 'routine'];
            const hasAbstract = abstractTerms.some(term => videoTerm.toLowerCase().includes(term));
            
            if (hasAbstract || videoTerm.length < 5) {
              // Generate fallback based on scene text
              videoTerm = this.extractVisualFromText(scene.text, contentType);
              console.log(`      Scene ${i+1}: Improved "${scene.video}" → "${videoTerm}"`);
            }
            
            return { ...scene, video: videoTerm };
          });
        }
        
        return {
          success: true,
          script: parsed.script,
          scenes: parsed.scenes || []
        };
      } catch (parseErr) {
        // Fallback: return just the script text
        console.log('   ⚠️ Could not parse JSON, using text as script');
        return {
          success: true,
          script: content.replace(/```json?\n?/g, '').replace(/```/g, '').replace(/[{}]/g, '').trim(),
          scenes: []
        };
      }
    } catch (error) {
      console.error('OpenAI script with scenes error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract visual search term from narration text
   * Fallback when AI returns abstract terms
   */
  extractVisualFromText(text, contentType = 'default') {
    if (!text) return 'abstract motion background';
    
    const lowerText = text.toLowerCase();
    
    // Keyword to visual mapping
    const visualMap = {
      // Body parts / fitness
      'abs': 'person showing abs muscles',
      'core': 'person core workout exercise',
      'arm': 'person arm workout biceps',
      'leg': 'person leg workout squats',
      'chest': 'person chest workout pushups',
      'muscle': 'muscular person gym workout',
      'body': 'fit person body transformation',
      
      // Actions
      'drink': 'person drinking water bottle',
      'eat': 'person eating healthy food',
      'sleep': 'person sleeping bed peaceful',
      'run': 'person running jogging outdoor',
      'walk': 'person walking outdoor',
      'exercise': 'person exercising gym workout',
      'workout': 'person gym workout training',
      'train': 'athlete training gym',
      'stretch': 'person stretching yoga',
      'plank': 'person plank position exercise',
      'crunch': 'person crunches abs exercise',
      'lift': 'person lifting weights gym',
      
      // Health/wellness
      'water': 'person drinking water hydration',
      'diet': 'healthy food meal plate',
      'food': 'healthy food cooking kitchen',
      'calorie': 'food nutrition healthy eating',
      'protein': 'protein food chicken eggs',
      'vitamin': 'healthy food fruits vegetables',
      'stress': 'person relaxing meditation calm',
      'rest': 'person resting relaxing couch',
      
      // Time
      'morning': 'person waking up sunrise morning',
      'night': 'person relaxing night bedtime',
      'daily': 'person daily routine morning',
      'week': 'calendar time planning',
      
      // Money/business
      'money': 'money cash dollars',
      'rich': 'wealthy person luxury',
      'business': 'business office professional',
      'work': 'person working laptop office',
      'save': 'piggy bank saving money',
      'invest': 'investment stocks finance',
      
      // Emotions
      'happy': 'happy person smiling celebrating',
      'fail': 'person frustrated struggling',
      'stop': 'person thinking contemplating',
      'start': 'person starting beginning action',
      'want': 'person desiring looking',
      'need': 'person needing searching',
      'try': 'person trying attempting effort',
      
      // Questions/hooks
      'why': 'person questioning thinking',
      'how': 'person explaining teaching',
      'what': 'person curious looking',
      'tip': 'person giving advice explaining',
      'secret': 'person revealing secret'
    };
    
    // Check for matches
    for (const [keyword, visual] of Object.entries(visualMap)) {
      if (lowerText.includes(keyword)) {
        return visual;
      }
    }
    
    // Content type fallbacks
    const fallbacks = {
      'fitness': 'person gym workout training',
      'motivation': 'person achieving success determined',
      'business': 'business professional office laptop',
      'health': 'healthy lifestyle person wellness',
      'tips': 'person explaining teaching advice',
      'default': 'person lifestyle modern'
    };
    
    return fallbacks[contentType] || fallbacks.default;
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
