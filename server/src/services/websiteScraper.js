/**
 * Website Scraper Service
 * 
 * Fetches public data from websites including:
 * - Business name, description
 * - Images/photos
 * - Contact info
 * - Social media links
 * - Meta information
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Normalize URL to ensure it has a protocol
 */
function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Resolve relative URLs to absolute
 */
function resolveUrl(baseUrl, relativeUrl) {
  try {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('data:')) return null; // Skip data URIs
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    const base = new URL(baseUrl);
    return new URL(relativeUrl, base).href;
  } catch {
    return null;
  }
}

/**
 * Check if URL is likely a logo or icon (not a product/content image)
 */
function isLogoOrIcon(url, alt = '', className = '') {
  const indicators = ['logo', 'icon', 'favicon', 'sprite', 'arrow', 'chevron', 'button', 'social'];
  const combined = (url + ' ' + alt + ' ' + className).toLowerCase();
  return indicators.some(ind => combined.includes(ind));
}

/**
 * Fetch and parse website data
 * 
 * @param {string} websiteUrl - The website URL to scrape
 * @returns {Promise<Object>} - Extracted website data
 */
async function scrapeWebsite(websiteUrl) {
  const url = normalizeUrl(websiteUrl);
  if (!url) {
    throw new Error('Invalid URL provided');
  }

  console.log(`🌐 Scraping website: ${url}`);

  try {
    // Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract data
    const data = {
      url: url,
      domain: extractDomain(url),
      
      // Basic info
      businessName: '',
      description: '',
      tagline: '',
      
      // Contact
      email: '',
      phone: '',
      address: '',
      
      // Social
      instagramHandle: '',
      facebookUrl: '',
      twitterHandle: '',
      linkedinUrl: '',
      
      // Images
      logo: null,
      images: [],
      
      // Meta
      keywords: [],
      industry: '',
      
      // Raw extracted text for AI processing
      aboutText: ''
    };

    // === Extract Business Name ===
    // Try meta tags first
    data.businessName = $('meta[property="og:site_name"]').attr('content') ||
                        $('meta[name="application-name"]').attr('content') ||
                        $('title').text().split('|')[0].split('-')[0].split('–')[0].trim() ||
                        '';

    // === Extract Description ===
    data.description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       '';

    // === Extract Tagline ===
    data.tagline = $('meta[property="og:title"]').attr('content') ||
                   $('h1').first().text().trim() ||
                   '';

    // === Extract Logo ===
    const logoUrl = $('meta[property="og:image"]').attr('content') ||
                    $('link[rel="icon"]').attr('href') ||
                    $('link[rel="apple-touch-icon"]').attr('href') ||
                    $('img[class*="logo"]').first().attr('src') ||
                    $('img[alt*="logo"]').first().attr('src') ||
                    $('header img').first().attr('src');
    
    if (logoUrl) {
      data.logo = resolveUrl(url, logoUrl);
    }

    // === Extract Social Media ===
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      
      if (href.includes('instagram.com/')) {
        const match = href.match(/instagram\.com\/([^\/\?]+)/);
        if (match && match[1] !== 'p' && match[1] !== 'explore') {
          data.instagramHandle = '@' + match[1];
        }
      }
      
      if (href.includes('facebook.com/') && !data.facebookUrl) {
        data.facebookUrl = href;
      }
      
      if (href.includes('twitter.com/') || href.includes('x.com/')) {
        const match = href.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
        if (match && !['share', 'intent', 'home'].includes(match[1])) {
          data.twitterHandle = '@' + match[1];
        }
      }
      
      if (href.includes('linkedin.com/') && !data.linkedinUrl) {
        data.linkedinUrl = href;
      }
    });

    // === Extract Email ===
    const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      data.email = emailMatch[0];
    }
    
    // Also check mailto links
    $('a[href^="mailto:"]').first().each((_, el) => {
      const mailto = $(el).attr('href');
      if (mailto) {
        data.email = mailto.replace('mailto:', '').split('?')[0];
      }
    });

    // === Extract Phone ===
    $('a[href^="tel:"]').first().each((_, el) => {
      const tel = $(el).attr('href');
      if (tel) {
        data.phone = tel.replace('tel:', '');
      }
    });

    // === Extract Keywords ===
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      data.keywords = metaKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    // === Extract Images ===
    const seenUrls = new Set();
    const images = [];

    // Get all images
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      const className = $(el).attr('class') || '';
      const width = parseInt($(el).attr('width')) || 0;
      const height = parseInt($(el).attr('height')) || 0;
      
      // Skip small images, icons, logos, and data URIs
      if (src.startsWith('data:')) return;
      if (width > 0 && width < 100) return;
      if (height > 0 && height < 100) return;
      if (isLogoOrIcon(src, alt, className)) return;
      
      const fullUrl = resolveUrl(url, src);
      if (fullUrl && !seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        images.push({
          url: fullUrl,
          alt: alt,
          width: width || null,
          height: height || null
        });
      }
    });

    // Also get background images from style attributes
    $('[style*="background"]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
      if (match && match[1]) {
        const bgUrl = resolveUrl(url, match[1]);
        if (bgUrl && !seenUrls.has(bgUrl) && !isLogoOrIcon(bgUrl)) {
          seenUrls.add(bgUrl);
          images.push({
            url: bgUrl,
            alt: 'Background image',
            width: null,
            height: null
          });
        }
      }
    });

    // Get OG images
    $('meta[property="og:image"]').each((_, el) => {
      const ogUrl = $(el).attr('content');
      if (ogUrl && !seenUrls.has(ogUrl)) {
        seenUrls.add(ogUrl);
        images.unshift({
          url: ogUrl,
          alt: 'Featured image',
          width: null,
          height: null,
          featured: true
        });
      }
    });

    data.images = images.slice(0, 20); // Limit to 20 images

    // === Extract About Text ===
    // Look for about sections
    const aboutSections = [];
    $('section, div, article').each((_, el) => {
      const text = $(el).text().toLowerCase();
      const id = $(el).attr('id') || '';
      const className = $(el).attr('class') || '';
      
      if (id.includes('about') || className.includes('about') || 
          text.includes('about us') || text.includes('who we are') ||
          text.includes('our story') || text.includes('our mission')) {
        const content = $(el).text().trim().slice(0, 1000);
        if (content.length > 50) {
          aboutSections.push(content);
        }
      }
    });
    
    data.aboutText = aboutSections.join('\n\n').slice(0, 2000);

    // === Extract Address ===
    // Look for address elements
    $('address').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10 && text.length < 200) {
        data.address = text.replace(/\s+/g, ' ');
      }
    });

    console.log(`✅ Scraped website successfully`);
    console.log(`   Business: ${data.businessName}`);
    console.log(`   Images: ${data.images.length}`);
    console.log(`   Instagram: ${data.instagramHandle || 'not found'}`);

    return {
      success: true,
      data: data
    };

  } catch (error) {
    console.error('Website scraping error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate if an image URL is accessible
 * 
 * @param {string} imageUrl - The image URL to validate
 * @returns {Promise<boolean>} - Whether the image is accessible
 */
async function validateImage(imageUrl) {
  try {
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      timeout: 5000
    });
    const contentType = response.headers.get('content-type') || '';
    return response.ok && contentType.startsWith('image/');
  } catch {
    return false;
  }
}

module.exports = {
  scrapeWebsite,
  validateImage,
  normalizeUrl,
  extractDomain
};
