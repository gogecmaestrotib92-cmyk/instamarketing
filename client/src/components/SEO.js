import React from 'react';
import { Helmet } from 'react-helmet-async';

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
  faq = null
}) => {
  const siteTitle = 'InstaMarketing';
  const siteName = 'InstaMarketing Srbija';
  
  // Srpski default sadržaj
  const defaultDescription = 'Automatizujte vaš Instagram marketing sa InstaMarketing platformom. Zakazivanje postova i reels-a, vođenje reklamnih kampanja, AI generisanje sadržaja, analitika i rast vaše publike. Najbolja platforma za Instagram marketing u Srbiji.';
  const defaultKeywords = 'Instagram automatizacija, Instagram marketing Srbija, zakazivanje Instagram postova, Instagram reels, Instagram reklame, društvene mreže marketing, AI sadržaj, influencer marketing, digitalni marketing Srbija, SMM Srbija, upravljanje društvenim mrežama, Instagram analitika, rast pratilaca, Instagram strategija, content marketing';
  const defaultImage = '/og-image.png';
  const siteUrl = 'https://instamarketing.rs';

  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} - #1 Platforma za Instagram Marketing u Srbiji`;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}${defaultImage}`;
  const canonicalUrl = url ? `${siteUrl}${url}` : siteUrl;

  // Strukturirani podaci - Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "Vodeća platforma za Instagram marketing i automatizaciju u Srbiji",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Beograd",
      "addressRegion": "Srbija",
      "addressCountry": "RS"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Serbian", "English"]
    },
    "sameAs": [
      "https://www.instagram.com/instamarketing_rs",
      "https://www.facebook.com/instamarketingrs",
      "https://twitter.com/instamarketing_rs",
      "https://www.linkedin.com/company/instamarketing-srbija"
    ]
  };

  // Strukturirani podaci - WebSite sa SearchAction
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": siteUrl,
    "description": metaDescription,
    "inLanguage": "sr-RS",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  // Strukturirani podaci - SoftwareApplication
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "InstaMarketing",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "RSD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "description": "Platforma za automatizaciju Instagram marketinga sa AI alatima"
  };

  // Strukturirani podaci - Article (ako je članak)
  const articleSchema = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title || title,
    "description": article.description || metaDescription,
    "image": article.image || metaImage,
    "author": {
      "@type": "Organization",
      "name": siteName
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  } : null;

  // Strukturirani podaci - Product (ako je proizvod/usluga)
  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image || metaImage,
    "brand": {
      "@type": "Brand",
      "name": siteName
    },
    "offers": {
      "@type": "Offer",
      "price": product.price || "0",
      "priceCurrency": "RSD",
      "availability": "https://schema.org/InStock"
    }
  } : null;

  // Strukturirani podaci - BreadcrumbList
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

  // Strukturirani podaci - FAQ
  const faqSchema = faq ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

  // LocalBusiness schema za Srbiju
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": siteName,
    "image": `${siteUrl}/logo.png`,
    "url": siteUrl,
    "telephone": "+381-11-123-4567",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Knez Mihailova",
      "addressLocality": "Beograd",
      "postalCode": "11000",
      "addressCountry": "RS"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 44.8176,
      "longitude": 20.4633
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    },
    "priceRange": "$$"
  };

  return (
    <Helmet>
      {/* Osnovni Meta Tagovi */}
      <html lang="sr" />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={siteName} />
      <meta name="language" content="Serbian" />
      <meta name="geo.region" content="RS" />
      <meta name="geo.placename" content="Srbija" />
      <meta name="geo.position" content="44.8176;20.4633" />
      <meta name="ICBM" content="44.8176, 20.4633" />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang za višejezičnost */}
      <link rel="alternate" hrefLang="sr" href={canonicalUrl} />
      <link rel="alternate" hrefLang="sr-RS" href={canonicalUrl} />
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
      <meta property="og:locale" content="sr_RS" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@instamarketing_rs" />
      <meta name="twitter:creator" content="@instamarketing_rs" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Dodatni Meta tagovi za SEO */}
      <meta name="theme-color" content="#667eea" />
      <meta name="msapplication-TileColor" content="#667eea" />
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />

      {/* Preconnect za performanse */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

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
        {JSON.stringify(localBusinessSchema)}
      </script>
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
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
