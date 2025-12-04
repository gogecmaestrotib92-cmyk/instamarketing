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
    
    /**
     * Add an image to the collection if valid
     */
    const addImage = (imgUrl, alt = '', priority = 0, source = 'img') => {
      if (!imgUrl) return;
      if (imgUrl.startsWith('data:')) return;
      
      const fullUrl = resolveUrl(url, imgUrl);
      if (!fullUrl) return;
      if (seenUrls.has(fullUrl)) return;
      
      // Skip tiny tracking pixels and icons
      if (fullUrl.includes('1x1') || fullUrl.includes('pixel') || fullUrl.includes('tracking')) return;
      if (fullUrl.includes('.svg') && !fullUrl.includes('photo') && !fullUrl.includes('image')) return;
      
      // Skip common non-content images
      const skipPatterns = [
        'facebook.com', 'twitter.com', 'linkedin.com', 'youtube.com',
        'google.com/ads', 'doubleclick', 'analytics', 'pixel',
        'badge', 'widget', 'button', 'payment', 'visa', 'mastercard',
        'paypal', 'stripe', 'trustpilot', 'rating', 'star'
      ];
      if (skipPatterns.some(p => fullUrl.toLowerCase().includes(p))) return;
      
      // Check if it's a logo/icon (but allow if it looks like featured content)
      if (isLogoOrIcon(fullUrl, alt, '') && priority < 5) return;
      
      seenUrls.add(fullUrl);
      images.push({
        url: fullUrl,
        alt: alt || '',
        priority: priority,
        source: source
      });
    };

    // 1. Get OG images first (highest priority - these are intentionally featured)
    $('meta[property="og:image"]').each((_, el) => {
      addImage($(el).attr('content'), 'Featured image', 10, 'og:image');
    });
    $('meta[property="og:image:secure_url"]').each((_, el) => {
      addImage($(el).attr('content'), 'Featured image', 10, 'og:image');
    });
    $('meta[name="twitter:image"]').each((_, el) => {
      addImage($(el).attr('content'), 'Featured image', 9, 'twitter:image');
    });

    // 2. Hero/banner images (high priority)
    $('[class*="hero"] img, [class*="banner"] img, [class*="slider"] img, [class*="carousel"] img').each((_, el) => {
      const $el = $(el);
      addImage(
        $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src'),
        $el.attr('alt'),
        8,
        'hero'
      );
    });

    // 3. Picture elements with source sets
    $('picture').each((_, el) => {
      const $picture = $(el);
      // Get the best source
      const sources = $picture.find('source').toArray();
      for (const source of sources) {
        const srcset = $(source).attr('srcset');
        if (srcset) {
          // Get the highest resolution image from srcset
          const srcParts = srcset.split(',').map(s => s.trim().split(' ')[0]);
          if (srcParts.length > 0) {
            addImage(srcParts[srcParts.length - 1], '', 7, 'picture-source');
          }
        }
      }
      // Also get the img fallback
      const $img = $picture.find('img');
      addImage(
        $img.attr('src') || $img.attr('data-src'),
        $img.attr('alt'),
        7,
        'picture-img'
      );
    });

    // 4. Figure elements (often contain important content images)
    $('figure img').each((_, el) => {
      const $el = $(el);
      addImage(
        $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src'),
        $el.attr('alt') || $el.closest('figure').find('figcaption').text(),
        6,
        'figure'
      );
    });

    // 5. Product images and gallery images
    $('[class*="product"] img, [class*="gallery"] img, [class*="portfolio"] img, [class*="grid"] img').each((_, el) => {
      const $el = $(el);
      addImage(
        $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src'),
        $el.attr('alt'),
        5,
        'product/gallery'
      );
    });

    // 6. All regular images with various lazy-loading attributes
    $('img').each((_, el) => {
      const $el = $(el);
      const width = parseInt($el.attr('width')) || 0;
      const height = parseInt($el.attr('height')) || 0;
      
      // Skip very small images
      if ((width > 0 && width < 80) || (height > 0 && height < 80)) return;
      
      // Check multiple possible source attributes
      const possibleSources = [
        $el.attr('src'),
        $el.attr('data-src'),
        $el.attr('data-lazy-src'),
        $el.attr('data-original'),
        $el.attr('data-lazy'),
        $el.attr('data-image'),
        $el.attr('data-srcset')?.split(',')[0]?.split(' ')[0], // First srcset image
        $el.attr('srcset')?.split(',').pop()?.trim().split(' ')[0] // Last (highest res) srcset
      ];
      
      for (const src of possibleSources) {
        if (src) {
          addImage(src, $el.attr('alt'), 3, 'img');
          break; // Only add the first valid source
        }
      }
    });

    // 7. Background images from inline styles
    $('[style*="background"]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const matches = style.matchAll(/url\(['"]?([^'")\s]+)['"]?\)/g);
      for (const match of matches) {
        if (match[1]) {
          addImage(match[1], 'Background image', 4, 'background-style');
        }
      }
    });

    // 8. Next.js / React optimized images (common patterns)
    $('img[srcset], img[data-nimg]').each((_, el) => {
      const $el = $(el);
      const srcset = $el.attr('srcset');
      if (srcset) {
        // Parse srcset and get highest resolution
        const parts = srcset.split(',').map(s => {
          const [url, size] = s.trim().split(' ');
          const width = parseInt(size) || 0;
          return { url, width };
        });
        // Sort by width descending and get the largest
        parts.sort((a, b) => b.width - a.width);
        if (parts[0]?.url) {
          addImage(parts[0].url, $el.attr('alt'), 5, 'srcset');
        }
      }
    });

    // 9. Video posters (often high quality images)
    $('video[poster]').each((_, el) => {
      addImage($(el).attr('poster'), 'Video thumbnail', 4, 'video-poster');
    });

    // 10. Links to images (sometimes galleries link directly to full-size images)
    $('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".webp"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.includes('download') && !href.includes('attachment')) {
        addImage(href, 'Linked image', 2, 'link');
      }
    });

    // Sort by priority (highest first) and limit
    images.sort((a, b) => b.priority - a.priority);
    data.images = images.slice(0, 30).map(img => ({
      url: img.url,
      alt: img.alt,
      source: img.source
    }));

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
 * Fetch HTML from a URL
 */
async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    },
    timeout: 10000
  });
  if (!response.ok) return null;
  return response.text();
}

/**
 * Scrape images from a single page
 */
async function scrapePageImages(pageUrl, $, baseUrl) {
  const images = [];
  const seenUrls = new Set();
  
  const addImage = (imgUrl, alt = '', priority = 0) => {
    if (!imgUrl || imgUrl.startsWith('data:')) return;
    const fullUrl = resolveUrl(baseUrl, imgUrl);
    if (!fullUrl || seenUrls.has(fullUrl)) return;
    if (isLogoOrIcon(fullUrl, alt, '')) return;
    seenUrls.add(fullUrl);
    images.push({ url: fullUrl, alt, priority });
  };

  // Standard img tags with lazy loading support
  $('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src') || $el.attr('data-original');
    addImage(src, $el.attr('alt'), 3);
    
    // Also check srcset for high-res versions
    const srcset = $el.attr('srcset');
    if (srcset) {
      const parts = srcset.split(',').map(s => s.trim().split(' ')[0]);
      if (parts.length > 0) addImage(parts[parts.length - 1], $el.attr('alt'), 4);
    }
  });

  // Picture sources
  $('picture source').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      const parts = srcset.split(',').map(s => s.trim().split(' ')[0]);
      if (parts.length > 0) addImage(parts[parts.length - 1], '', 4);
    }
  });

  // Background images
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (match) addImage(match[1], 'Background', 2);
  });

  return images;
}

/**
 * Scrape website deeply - including sub-pages for more images
 * 
 * @param {string} websiteUrl - The website URL to scrape
 * @param {boolean} deep - Whether to also scrape sub-pages
 * @returns {Promise<Object>} - Extracted website data
 */
async function scrapeWebsiteDeep(websiteUrl, deep = true) {
  const mainResult = await scrapeWebsite(websiteUrl);
  if (!mainResult.success) return mainResult;
  
  if (!deep) return mainResult;
  
  const baseUrl = normalizeUrl(websiteUrl);
  const baseUrlObj = new URL(baseUrl);
  const baseDomain = baseUrlObj.hostname;
  
  console.log(`🔍 Deep scraping ${baseDomain} for more images...`);
  
  // Pages likely to have good images
  const subPagesToTry = [
    '/about', '/about-us', '/our-story',
    '/products', '/shop', '/store', '/collections',
    '/gallery', '/portfolio', '/work', '/projects',
    '/services', '/team', '/photos'
  ];
  
  const allImages = [...mainResult.data.images];
  const seenUrls = new Set(allImages.map(img => img.url));
  
  // Try to find and scrape sub-pages (limit to 3 additional pages to stay fast)
  let pagesScraped = 0;
  const maxExtraPages = 3;
  
  for (const subPage of subPagesToTry) {
    if (pagesScraped >= maxExtraPages) break;
    
    try {
      const subUrl = new URL(subPage, baseUrl).href;
      console.log(`   Checking: ${subUrl}`);
      
      const html = await fetchHtml(subUrl);
      if (!html) continue;
      
      pagesScraped++;
      const $ = cheerio.load(html);
      const pageImages = await scrapePageImages(subUrl, $, baseUrl);
      
      // Add new images
      for (const img of pageImages) {
        if (!seenUrls.has(img.url)) {
          seenUrls.add(img.url);
          allImages.push({
            url: img.url,
            alt: img.alt,
            source: `subpage:${subPage}`
          });
        }
      }
      
      console.log(`   Found ${pageImages.length} images on ${subPage}`);
      
    } catch (err) {
      // Page doesn't exist or error, continue
    }
  }
  
  // Update images list, sorted by priority
  mainResult.data.images = allImages.slice(0, 40); // Increased limit
  console.log(`✅ Deep scrape complete: ${mainResult.data.images.length} total images`);
  
  return mainResult;
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
  scrapeWebsiteDeep,
  validateImage,
  normalizeUrl,
  extractDomain
};
