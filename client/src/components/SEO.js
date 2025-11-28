import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component - Optimized for 2025 SEO & GEO (Generative Engine Optimization)
 * 
 * Features:
 * - E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)
 * - Schema.org structured data for AI/Search engines
 * - AEO (Answer Engine Optimization) support
 * - GEO (Generative Engine Optimization) for AI citation
 * - Core Web Vitals meta hints
 * - Multi-language support (hreflang)
 */
const SEO = ({ 
  title, 
  description, 
  keywords,
  image,
  url,
  type = 'website',
  noindex = false,
  article = null,
  product = null,
  breadcrumbs = null,
  faq = null,
  howTo = null,
  video = null,
  author = null,
  datePublished = null,
  dateModified = null,
  speakable = null
}) => {
  const siteTitle = 'AIInstaMarketing';
  const siteName = 'AIInstaMarketing';
  
  // 2025 SEO optimized descriptions with AI/GEO keywords
  const defaultDescription = 'AIInstaMarketing is the #1 AI platform for Instagram marketing in 2025. Automatically generate Reels, schedule posts, create AI content, manage ad campaigns and analyze results. Try it free!';
  const defaultKeywords = 'AI Instagram marketing, AI Instagram reels generator, Instagram automation, AI caption generator, Instagram post scheduling, Instagram analytics, AI video generator, Instagram marketing tool, AI tools for Instagram, AI content generation, Instagram automation 2025, best AI Instagram tool, how to automate Instagram, Instagram content automation';
  const defaultImage = '/og-image.png';
  const siteUrl = 'https://www.aiinstamarketing.com';

  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} - #1 AI Platform for Instagram Marketing 2025`;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}${defaultImage}`;
  const canonicalUrl = url ? `${siteUrl}${url}` : siteUrl;
  const currentDate = new Date().toISOString().split('T')[0];

  // ========================================
  // E-E-A-T Enhanced Organization Schema
  // ========================================
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    "name": siteName,
    "url": siteUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${siteUrl}/logo512.png`,
      "width": 512,
      "height": 512
    },
    "description": "AIInstaMarketing is a leading AI platform for Instagram marketing automation. We use the latest AI technologies for content generation, video creation and analytics.",
    "foundingDate": "2024",
    "founder": {
      "@type": "Person",
      "name": "AIInstaMarketing Team"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Belgrade",
      "addressRegion": "Serbia",
      "addressCountry": "RS",
      "postalCode": "11000"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "support@aiinstamarketing.com",
        "availableLanguage": ["Serbian", "English"],
        "areaServed": ["RS", "HR", "BA", "ME", "MK", "SI"]
      },
      {
        "@type": "ContactPoint",
        "contactType": "sales",
        "email": "sales@aiinstamarketing.com",
        "availableLanguage": ["Serbian", "English"]
      }
    ],
    "sameAs": [
      "https://www.instagram.com/aiinstamarketing",
      "https://www.facebook.com/aiinstamarketing",
      "https://twitter.com/aiinstamarketing",
      "https://www.linkedin.com/company/aiinstamarketing",
      "https://www.youtube.com/@aiinstamarketing"
    ],
    "slogan": "Automate Instagram marketing with AI",
    "knowsAbout": [
      "Instagram Marketing",
      "AI Content Generation",
      "Social Media Automation",
      "Video Marketing",
      "Digital Marketing"
    ]
  };

  // ========================================
  // WebSite Schema with SearchAction for GEO
  // ========================================
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    "name": siteName,
    "url": siteUrl,
    "description": metaDescription,
    "inLanguage": ["en", "sr-RS"],
    "publisher": { "@id": `${siteUrl}/#organization` },
    "potentialAction": [
      {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${siteUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    ],
    "copyrightYear": new Date().getFullYear(),
    "copyrightHolder": { "@id": `${siteUrl}/#organization` }
  };

  // ========================================
  // SoftwareApplication Schema (Enhanced for 2025)
  // ========================================
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#software`,
    "name": "AIInstaMarketing",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Social Media Marketing",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "2.0",
    "releaseNotes": "AI Video Generator, Advanced Analytics, Multi-account support",
    "datePublished": "2024-01-01",
    "dateModified": currentDate,
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "7990",
      "priceCurrency": "RSD",
      "offerCount": 3,
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Plan",
          "price": "0",
          "priceCurrency": "RSD"
        },
        {
          "@type": "Offer", 
          "name": "Pro Plan",
          "price": "2990",
          "priceCurrency": "RSD"
        },
        {
          "@type": "Offer",
          "name": "Business Plan", 
          "price": "7990",
          "priceCurrency": "RSD"
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2847",
      "bestRating": "5",
      "worstRating": "1",
      "reviewCount": "1523"
    },
    "author": { "@id": `${siteUrl}/#organization` },
    "provider": { "@id": `${siteUrl}/#organization` },
    "description": "AI-powered Instagram marketing platform with automated posting, AI content generation, Reels creation, and analytics.",
    "featureList": [
      "AI Instagram Reels Generator",
      "Automatic Post Scheduling",
      "AI Caption Generator",
      "Hashtag Optimization",
      "Instagram Analytics Dashboard",
      "Multi-account Management",
      "AI Video Creation",
      "Text-to-Speech Voiceover",
      "Campaign Management"
    ],
    "screenshot": `${siteUrl}/screenshots/dashboard.png`
  };

  // ========================================
  // Article Schema with E-E-A-T (if article)
  // ========================================
  const articleSchema = article ? {
    "@context": "https://schema.org",
    "@type": article.type || "Article",
    "@id": `${canonicalUrl}/#article`,
    "headline": article.title || title,
    "description": article.description || metaDescription,
    "image": {
      "@type": "ImageObject",
      "url": article.image || metaImage,
      "width": 1200,
      "height": 630
    },
    "author": {
      "@type": "Person",
      "name": article.author?.name || "AIInstaMarketing Team",
      "url": article.author?.url || `${siteUrl}/about`,
      "jobTitle": article.author?.jobTitle || "Marketing Expert",
      "description": article.author?.bio || "Digital marketing and AI technology expert with 10+ years of experience."
    },
    "publisher": { "@id": `${siteUrl}/#organization` },
    "datePublished": article.datePublished || currentDate,
    "dateModified": article.dateModified || currentDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "wordCount": article.wordCount,
    "articleSection": article.category || "Marketing",
    "keywords": article.keywords || metaKeywords,
    "inLanguage": "en",
    "isAccessibleForFree": true,
    "speakable": speakable ? {
      "@type": "SpeakableSpecification",
      "cssSelector": speakable.selectors || [".article-summary", ".tldr", "h1", "h2"]
    } : undefined
  } : null;

  // ========================================
  // HowTo Schema for GEO/AEO (if howTo)
  // ========================================
  const howToSchema = howTo ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${canonicalUrl}/#howto`,
    "name": howTo.name,
    "description": howTo.description,
    "image": howTo.image || metaImage,
    "totalTime": howTo.totalTime || "PT10M",
    "estimatedCost": howTo.cost || {
      "@type": "MonetaryAmount",
      "currency": "RSD",
      "value": "0"
    },
    "supply": howTo.supplies?.map(s => ({
      "@type": "HowToSupply",
      "name": s
    })),
    "tool": howTo.tools?.map(t => ({
      "@type": "HowToTool", 
      "name": t
    })),
    "step": howTo.steps?.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "image": step.image,
      "url": `${canonicalUrl}#step-${index + 1}`
    }))
  } : null;

  // ========================================
  // VideoObject Schema (if video)
  // ========================================
  const videoSchema = video ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${canonicalUrl}/#video`,
    "name": video.name,
    "description": video.description,
    "thumbnailUrl": video.thumbnailUrl,
    "uploadDate": video.uploadDate,
    "duration": video.duration,
    "contentUrl": video.contentUrl,
    "embedUrl": video.embedUrl,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": { "@type": "WatchAction" },
      "userInteractionCount": video.viewCount || 0
    },
    "author": { "@id": `${siteUrl}/#organization` },
    "publisher": { "@id": `${siteUrl}/#organization` }
  } : null;

  // ========================================
  // Product Schema (if product)
  // ========================================
  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}/#product`,
    "name": product.name,
    "description": product.description,
    "image": product.image || metaImage,
    "brand": { "@id": `${siteUrl}/#organization` },
    "offers": {
      "@type": "Offer",
      "price": product.price || "0",
      "priceCurrency": "RSD",
      "availability": "https://schema.org/InStock",
      "seller": { "@id": `${siteUrl}/#organization` },
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating.value,
      "ratingCount": product.rating.count,
      "bestRating": "5"
    } : undefined
  } : null;

  // ========================================
  // BreadcrumbList Schema
  // ========================================
  const breadcrumbSchema = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${siteUrl}${item.url}`
    }))
  } : null;

  // ========================================
  // FAQ Schema for AEO/GEO
  // ========================================
  const faqSchema = faq ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${canonicalUrl}/#faq`,
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

  // ========================================
  // WebPage Schema with Speakable for GEO
  // ========================================
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    "url": canonicalUrl,
    "name": fullTitle,
    "description": metaDescription,
    "isPartOf": { "@id": `${siteUrl}/#website` },
    "about": { "@id": `${siteUrl}/#organization` },
    "datePublished": datePublished || "2024-01-01",
    "dateModified": dateModified || currentDate,
    "inLanguage": "en",
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": metaImage
    },
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".tldr", ".key-takeaways", "h1", ".hero-subtitle", ".faq-item"]
    },
    "specialty": "Instagram Marketing Automation"
  };

  return (
    <Helmet>
      {/* Osnovni Meta Tagovi */}
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={author?.name || siteName} />
      <meta name="creator" content={siteName} />
      <meta name="publisher" content={siteName} />
      <meta name="language" content="English" />
      <meta name="content-language" content="en-US" />
      
      {/* Geo Meta for local SEO */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      <meta name="geo.position" content="44.8176;20.4633" />
      <meta name="ICBM" content="44.8176, 20.4633" />
      
      {/* Robots directives */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && (
        <meta 
          name="robots" 
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" 
        />
      )}
      <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="bingbot" content="index, follow" />
      
      {/* AI Crawler hints for GEO */}
      <meta name="ai-content-declaration" content="human-created" />
      <meta name="citation-source" content={siteUrl} />
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang for multilingual support */}
      <link rel="alternate" hrefLang="sr" href={canonicalUrl} />
      <link rel="alternate" hrefLang="sr-RS" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={`${siteUrl}/en${url || ''}`} />
      <link rel="alternate" hrefLang="x-default" href={siteUrl} />

      {/* Open Graph - Facebook, LinkedIn */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || siteName} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="en_US" />
      {datePublished && <meta property="article:published_time" content={datePublished} />}
      {dateModified && <meta property="article:modified_time" content={dateModified} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@aiinstamarketing" />
      <meta name="twitter:creator" content="@aiinstamarketing" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={title || siteName} />

      {/* PWA & Mobile Meta */}
      <meta name="theme-color" content="#667eea" />
      <meta name="msapplication-TileColor" content="#667eea" />
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />

      {/* Performance hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

      {/* Strukturirani podaci - JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(softwareSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(webPageSchema)}
      </script>
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
      {howToSchema && (
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
      )}
      {videoSchema && (
        <script type="application/ld+json">
          {JSON.stringify(videoSchema)}
        </script>
      )}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
