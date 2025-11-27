// SEO Configuration for Serbian Market
export const seoConfig = {
  siteName: 'InstaMarketing',
  siteUrl: 'https://instamarketing.rs',
  defaultImage: 'https://instamarketing.rs/og-image.jpg',
  twitterHandle: '@instamarketingrs',
  locale: 'sr_RS',
  
  pages: {
    home: {
      title: 'InstaMarketing - Automatizacija Instagram Marketinga | Srbija',
      description: 'Automatizujte Instagram marketing pomoću AI tehnologije. Zakazujte objave, kreirajte rilsove, vodite reklamne kampanje i analizirajte rezultate. #1 alat u Srbiji.',
      keywords: 'instagram marketing, automatizacija instagram, zakazivanje objava, instagram analitika, reklamne kampanje instagram, AI marketing, social media marketing srbija'
    },
    
    dashboard: {
      title: 'Kontrolna Tabla | InstaMarketing',
      description: 'Pregledajte sve Instagram metrike na jednom mestu. Pratite rast pratilaca, engagement, reach i performanse objava u realnom vremenu.',
      keywords: 'instagram dashboard, kontrolna tabla, instagram metrike, praćenje performansi, instagram statistika'
    },
    
    aiTools: {
      title: 'AI Alati za Instagram | Generisanje Sadržaja | InstaMarketing',
      description: 'Koristite veštačku inteligenciju za kreiranje Instagram sadržaja. AI Caption generator, hashtag predlozi, skripta za rilsove, generisanje video sadržaja i voiceover.',
      keywords: 'AI instagram, generator captiona, hashtag generator, AI video, voiceover, skripta za rilsove, veštačka inteligencija marketing'
    },
    
    scheduler: {
      title: 'Zakazivanje Objava | Instagram Scheduler | InstaMarketing',
      description: 'Zakazujte Instagram objave i rilsove unapred. Kalendarski prikaz, automatsko objavljivanje, optimalno vreme za postovanje.',
      keywords: 'zakazivanje instagram objava, instagram scheduler, automatsko postovanje, planer sadržaja, content calendar'
    },
    
    analytics: {
      title: 'Instagram Analitika | Detaljni Izveštaji | InstaMarketing',
      description: 'Dubinska analiza Instagram performansi. Pratite engagement rate, reach, impressions, rast pratilaca i ROI reklamnih kampanja.',
      keywords: 'instagram analitika, instagram statistika, engagement rate, reach analiza, ROI praćenje, izveštaji instagram'
    },
    
    posts: {
      title: 'Upravljanje Objavama | Instagram Posts | InstaMarketing',
      description: 'Kreirajte, upravljajte i optimizujte Instagram objave. AI asistent za pisanje captiona, izbor hashtag-ova i analiza performansi.',
      keywords: 'instagram objave, kreiranje posta, upravljanje sadržajem, instagram feed, optimizacija objava'
    },
    
    reels: {
      title: 'Instagram Rilsovi | Video Marketing | InstaMarketing',
      description: 'Kreirajte virusne Instagram rilsove pomoću AI tehnologije. Automatsko generisanje videa, dodavanje muzike, titlova i efekata.',
      keywords: 'instagram reels, rilsovi, video marketing, kratki video sadržaj, viral video, AI video generator'
    },
    
    campaigns: {
      title: 'Reklamne Kampanje | Instagram Ads | InstaMarketing',
      description: 'Upravljajte Instagram reklamnim kampanjama. A/B testiranje, targetiranje publike, praćenje konverzija i optimizacija budžeta.',
      keywords: 'instagram reklame, reklamne kampanje, instagram ads, targetiranje, konverzije, ROI reklama'
    },
    
    settings: {
      title: 'Podešavanja | Konfiguracija Naloga | InstaMarketing',
      description: 'Podesite vaš InstaMarketing nalog. Povezivanje Instagram naloga, notifikacije, bezbednost i preferencije.',
      keywords: 'podešavanja, konfiguracija naloga, instagram povezivanje, bezbednost naloga'
    },
    
    login: {
      title: 'Prijava | InstaMarketing',
      description: 'Prijavite se na InstaMarketing platformu i započnite sa automatizacijom vašeg Instagram marketinga.',
      keywords: 'prijava, login, instamarketing prijava'
    },
    
    register: {
      title: 'Registracija | Kreirajte Nalog | InstaMarketing',
      description: 'Registrujte se besplatno i počnite da koristite InstaMarketing. Automatizujte Instagram marketing već danas.',
      keywords: 'registracija, kreiranje naloga, besplatna registracija, instamarketing nalog'
    }
  },
  
  // Schema.org types for each page
  schemas: {
    organization: {
      "@type": "Organization",
      "@id": "https://instamarketing.rs/#organization",
      "name": "InstaMarketing",
      "url": "https://instamarketing.rs",
      "logo": "https://instamarketing.rs/logo512.png",
      "description": "Vodeća platforma za automatizaciju Instagram marketinga u Srbiji",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Beograd",
        "addressCountry": "RS"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Serbian", "English"]
      },
      "sameAs": [
        "https://www.instagram.com/instamarketingrs",
        "https://www.facebook.com/instamarketingrs",
        "https://twitter.com/instamarketingrs",
        "https://www.linkedin.com/company/instamarketingrs"
      ]
    },
    
    softwareApplication: {
      "@type": "SoftwareApplication",
      "name": "InstaMarketing",
      "operatingSystem": "Web",
      "applicationCategory": "BusinessApplication",
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
      }
    },
    
    faqItems: [
      {
        question: "Šta je InstaMarketing?",
        answer: "InstaMarketing je platforma za automatizaciju Instagram marketinga koja koristi AI tehnologiju za kreiranje sadržaja, zakazivanje objava, analizu performansi i vođenje reklamnih kampanja."
      },
      {
        question: "Da li je InstaMarketing besplatan?",
        answer: "Da, InstaMarketing nudi besplatan plan sa osnovnim funkcijama. Premium planovi sa naprednim AI alatima i neograničenim objavama su dostupni po pristupačnim cenama."
      },
      {
        question: "Kako da povežem Instagram nalog?",
        answer: "Nakon registracije, idite u Podešavanja i kliknite na 'Poveži Instagram'. Bićete preusmereni na Facebook/Instagram autorizaciju gde odobravate pristup vašem poslovnom nalogu."
      },
      {
        question: "Da li InstaMarketing podržava Instagram Reels?",
        answer: "Da, InstaMarketing ima potpunu podršku za Instagram Reels uključujući AI generisanje video sadržaja, automatsko dodavanje titlova, muzike i zakazivanje objava."
      },
      {
        question: "Kako funkcioniše AI generisanje sadržaja?",
        answer: "Naši AI alati koriste napredne modele veštačke inteligencije za generisanje captiona, hashtag-ova, skripti za video, pa čak i samog video sadržaja na osnovu vaših uputstava."
      },
      {
        question: "Da li mogu da zakazujem objave unapred?",
        answer: "Da, možete zakazati neograničen broj objava unapred. Naš scheduler automatski objavljuje sadržaj u optimalno vreme za maksimalan engagement."
      }
    ]
  },
  
  // Breadcrumb configurations
  breadcrumbs: {
    dashboard: [
      { name: 'Početna', url: '/' },
      { name: 'Kontrolna Tabla', url: '/dashboard' }
    ],
    aiTools: [
      { name: 'Početna', url: '/' },
      { name: 'AI Alati', url: '/ai-tools' }
    ],
    scheduler: [
      { name: 'Početna', url: '/' },
      { name: 'Zakazivanje', url: '/scheduler' }
    ],
    analytics: [
      { name: 'Početna', url: '/' },
      { name: 'Analitika', url: '/analytics' }
    ],
    posts: [
      { name: 'Početna', url: '/' },
      { name: 'Objave', url: '/posts' }
    ],
    reels: [
      { name: 'Početna', url: '/' },
      { name: 'Rilsovi', url: '/reels' }
    ],
    campaigns: [
      { name: 'Početna', url: '/' },
      { name: 'Kampanje', url: '/campaigns' }
    ],
    settings: [
      { name: 'Početna', url: '/' },
      { name: 'Podešavanja', url: '/settings' }
    ]
  }
};

export default seoConfig;
