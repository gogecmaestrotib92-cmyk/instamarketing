import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaRobot, FaChartLine, FaCalendarAlt, FaBullhorn, FaVideo, FaStar, FaQuoteLeft } from 'react-icons/fa';
import { FiCheck, FiArrowRight, FiAward, FiShield, FiUsers, FiGlobe } from 'react-icons/fi';
import SEO from '../components/SEO';
import './Home.css';

const Home = () => {
  // Key features for AI extraction
  const features = [
    {
      icon: FaVideo,
      title: 'AI Video Generator za Reels',
      description: 'Generišite profesionalne Instagram Reels pomoću AI. Text-to-video tehnologija kreira viralne video sadržaje za 2 minuta.',
      keywords: ['AI video generator', 'Instagram Reels', 'text-to-video']
    },
    {
      icon: FaCalendarAlt,
      title: 'Automatsko Zakazivanje Objava',
      description: 'Zakazujte Instagram objave i Reels unapred. AI analizira vašu publiku i predlaže optimalno vreme objavljivanja.',
      keywords: ['zakazivanje objava', 'Instagram scheduler', 'automatsko postovanje']
    },
    {
      icon: FaRobot,
      title: 'AI Caption & Hashtag Generator',
      description: 'GPT-4 tehnologija generiše engaging captione i optimizovane hashtag-ove za maksimalan reach i engagement.',
      keywords: ['AI caption generator', 'hashtag generator', 'GPT-4']
    },
    {
      icon: FaChartLine,
      title: 'AI-Powered Analitika',
      description: 'Dubinska analiza performansi sa AI insightima. Pratite engagement, reach, rast pratilaca i ROI u realnom vremenu.',
      keywords: ['Instagram analitika', 'engagement rate', 'AI insights']
    },
    {
      icon: FaBullhorn,
      title: 'Smart Reklamne Kampanje',
      description: 'AI optimizuje vaše Instagram reklame. A/B testiranje, automatsko targetiranje i maksimizacija ROAS-a.',
      keywords: ['Instagram ads', 'ROAS optimizacija', 'A/B testiranje']
    },
    {
      icon: FaInstagram,
      title: 'Official Instagram API',
      description: 'Direktna integracija sa Meta Business API. Sigurno povezivanje, pouzdano objavljivanje, 99.9% uptime.',
      keywords: ['Instagram API', 'Meta Business', 'sigurna integracija']
    }
  ];

  const pricingPlans = [
    {
      name: 'Besplatno',
      price: '0',
      period: 'zauvek',
      features: [
        '5 zakazanih objava mesečno',
        'AI Caption generator',
        'Hashtag predlozi',
        'Osnovna analitika',
        '1 Instagram nalog',
        'Email podrška'
      ],
      cta: 'Započni Besplatno',
      popular: false
    },
    {
      name: 'Pro',
      price: '2,990',
      period: 'mesečno',
      features: [
        'Neograničeno zakazivanje',
        'Svi AI alati',
        'AI Video Generator (50 videa/mes)',
        'AI Voiceover',
        'Napredna analitika',
        'Do 3 Instagram naloga',
        'Prioritetna podrška'
      ],
      cta: 'Započni 14 Dana Besplatno',
      popular: true
    },
    {
      name: 'Business',
      price: '7,990',
      period: 'mesečno',
      features: [
        'Sve iz Pro plana',
        'Neograničeni AI videi',
        'Do 10 Instagram naloga',
        'Tim pristup (5 članova)',
        'Reklamne kampanje',
        'API pristup',
        'Dedicirani account manager',
        'Custom integracije'
      ],
      cta: 'Kontaktirajte Nas',
      popular: false,
      link: '/contact'
    }
  ];

  // Extended FAQ for AEO/GEO
  const faqs = [
    {
      question: 'Šta je AIInstaMarketing i kako funkcioniše?',
      answer: 'AIInstaMarketing je vodeća AI platforma za automatizaciju Instagram marketinga. Koristi napredne AI modele (GPT-4, Stable Diffusion) za generisanje video sadržaja, pisanje captiona, optimizaciju hashtag-ova i analizu performansi. Platforma se povezuje sa vašim Instagram Business nalogom putem zvaničnog Meta API-ja, omogućavajući automatsko zakazivanje i objavljivanje sadržaja.'
    },
    {
      question: 'Kako AI generiše Instagram Reels video sadržaj?',
      answer: 'Naš AI Video Generator koristi text-to-video tehnologiju. Unosite prompt (opis željenog videa), birate trajanje (5-60 sekundi) i stil. AI zatim generiše profesionalni video sa tranzicijama, efektima i opcionalnim AI voiceoverom. Proces traje 1-2 minuta, a rezultat je video optimizovan za Instagram Reels format (9:16).'
    },
    {
      question: 'Da li je AIInstaMarketing besplatan?',
      answer: 'Da! Nudimo trajno besplatan plan sa 5 zakazanih objava mesečno, AI caption generatorom i osnovnom analitikom. Pro plan (2,990 RSD/mes) dodaje neograničeno zakazivanje i AI video generator. Svi plaćeni planovi imaju 14 dana besplatnog trial perioda bez potrebe za kreditnom karticom.'
    },
    {
      question: 'Kako da povežem Instagram nalog sa platformom?',
      answer: 'Povezivanje je jednostavno: 1) Registrujte se na AIInstaMarketing, 2) Idite u Podešavanja > Poveži Instagram, 3) Kliknite "Poveži" i autorizujte pristup putem Facebook/Meta, 4) Izaberite Instagram Business ili Creator nalog. Ceo proces traje manje od 2 minuta i koristi zvanični Meta OAuth protokol za maksimalnu sigurnost.'
    },
    {
      question: 'Koje je najbolje vreme za objavljivanje na Instagramu?',
      answer: 'Optimalno vreme varira po publici, ali naš AI analizira kada su vaši pratioci najaktivniji. Generalno, najbolji periodi su: radnim danima 11-13h i 19-21h, vikendima 10-14h. AIInstaMarketing automatski predlaže personalizovano optimalno vreme za svaku objavu bazirano na analizi vaše specifične publike.'
    },
    {
      question: 'Da li AIInstaMarketing radi sa više Instagram naloga?',
      answer: 'Da! Besplatan plan podržava 1 nalog, Pro plan do 3 naloga, a Business plan do 10 naloga. Svi nalozi se upravljaju iz jednog dashboard-a sa mogućnošću brzog prebacivanja između naloga. Idealno za agencije i marketare koji upravljaju više brendova.'
    },
    {
      question: 'Kako AI Caption Generator kreira engaging sadržaj?',
      answer: 'AI Caption Generator koristi GPT-4 model treniran na milionima uspešnih Instagram objava. Analizira vašu temu, ton brenda i ciljnu publiku. Generiše više varijanti captiona sa emoji-jima, call-to-action-ima i optimizovanom dužinom. Možete birati između profesionalnog, zabavnog ili inspirativnog tona.'
    },
    {
      question: 'Da li je sigurno povezivati Instagram sa AIInstaMarketing?',
      answer: 'Apsolutno sigurno. Koristimo zvanični Meta Business API i OAuth 2.0 autentifikaciju. Nikada ne čuvamo vaše Instagram lozinke. Svi podaci su enkriptovani (AES-256), a naši serveri su ISO 27001 sertifikovani. Možete u svakom trenutku opozvati pristup iz Facebook podešavanja.'
    }
  ];

  // Trust signals data
  const trustStats = [
    { number: '15,000+', label: 'Aktivnih Korisnika', icon: FiUsers },
    { number: '2M+', label: 'Objavljenih Postova', icon: FaInstagram },
    { number: '50+', label: 'Zemalja', icon: FiGlobe },
    { number: '4.9★', label: 'Prosečna Ocena', icon: FaStar }
  ];

  // Testimonials for E-E-A-T
  const testimonials = [
    {
      name: 'Marija Petrović',
      role: 'Influencer, 150K pratilaca',
      text: 'AIInstaMarketing mi je uštedeo 10+ sati nedeljno. AI video generator je neverovatno - kreiram Reels za par minuta!',
      rating: 5
    },
    {
      name: 'Stefan Jovanović',
      role: 'Marketing Manager, TechStartup d.o.o.',
      text: 'Najbolji alat za Instagram marketing koji sam koristio. Analitika je detaljna, a AI predlozi su uvek relevantni.',
      rating: 5
    },
    {
      name: 'Ana Nikolić',
      role: 'Vlasnik online prodavnice',
      text: 'Od kada koristim AIInstaMarketing, moj engagement je porastao za 300%. Preporučujem svima!',
      rating: 5
    }
  ];

  // HowTo data for schema
  const howToData = {
    name: 'Kako koristiti AIInstaMarketing za Instagram automatizaciju',
    description: 'Vodič korak po korak za automatizaciju Instagram marketinga pomoću AI tehnologije.',
    totalTime: 'PT10M',
    steps: [
      { name: 'Registracija', text: 'Kreirajte besplatan nalog na AIInstaMarketing.com. Proces traje manje od 1 minut.' },
      { name: 'Povezivanje Instagrama', text: 'Povežite vaš Instagram Business ili Creator nalog putem sigurne Meta autorizacije.' },
      { name: 'Kreiranje sadržaja', text: 'Koristite AI alate za generisanje captiona, hashtag-ova ili čak celih video sadržaja.' },
      { name: 'Zakazivanje objava', text: 'Zakažite objave unapred - AI će predložiti optimalno vreme za maksimalan engagement.' },
      { name: 'Praćenje rezultata', text: 'Analizirajte performanse u realnom vremenu i optimizujte strategiju na osnovu AI insights-a.' }
    ]
  };

  return (
    <main className="home-page">
      <SEO 
        title="AI Instagram Marketing Platforma | Automatizacija Reels & Objava 2025"
        description="AIInstaMarketing je #1 AI platforma za Instagram marketing. Automatski generišite Reels, zakazujte objave, kreirajte AI sadržaj i analizirajte rezultate. Besplatna probna verzija!"
        keywords="AI Instagram marketing, AI Instagram reels generator, automatizacija Instagram, AI caption generator, zakazivanje Instagram objava, Instagram analitika, AI video generator, Instagram marketing platforma 2025"
        url="/"
        faq={faqs}
        howTo={howToData}
        datePublished="2024-01-01"
        dateModified="2025-11-28"
      />

      {/* TL;DR Section for AI/GEO - Key Takeaways */}
      <section className="tldr-section" aria-label="Ključne informacije">
        <div className="tldr-container">
          <h2 className="tldr-title">📋 TL;DR - Šta je AIInstaMarketing?</h2>
          <ul className="tldr-list">
            <li><strong>AI Video Generator:</strong> Kreirajte Instagram Reels automatski pomoću text-to-video AI tehnologije</li>
            <li><strong>Smart Scheduler:</strong> Zakazujte objave unapred sa AI preporukama optimalnog vremena</li>
            <li><strong>AI Caption Generator:</strong> GPT-4 generiše engaging captione i optimizovane hashtag-ove</li>
            <li><strong>Analitika u realnom vremenu:</strong> Pratite engagement, reach i ROI sa AI insights-ima</li>
            <li><strong>Besplatan plan:</strong> Započnite besplatno, nadogradite kada budete spremni</li>
          </ul>
        </div>
      </section>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <div className="hero-badge">🏆 #1 AI Instagram Platforma 2025</div>
          <h1>
            Automatizujte <span className="gradient-text">Instagram Marketing</span> Pomoću AI
          </h1>
          <p className="hero-subtitle">
            Generišite viralne Reels, zakazujte objave, kreirajte AI sadržaj i 
            povećajte engagement 10x brže sa AIInstaMarketing platformom.
          </p>
          
          {/* Key benefits list for AI extraction */}
          <ul className="hero-benefits" aria-label="Ključne prednosti">
            <li><FiCheck aria-hidden="true" /> AI Video Generator za Instagram Reels</li>
            <li><FiCheck aria-hidden="true" /> Automatsko zakazivanje sa AI optimizacijom</li>
            <li><FiCheck aria-hidden="true" /> GPT-4 Caption & Hashtag Generator</li>
            <li><FiCheck aria-hidden="true" /> 14 dana besplatno, bez kreditne kartice</li>
          </ul>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg" aria-label="Započnite besplatno sa AIInstaMarketing">
              Započnite Besplatno <FiArrowRight aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg" aria-label="Prijavite se na platformu">
              Prijavite Se
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="hero-trust">
            <span className="trust-badge"><FiShield aria-hidden="true" /> Meta Business Partner</span>
            <span className="trust-badge"><FiAward aria-hidden="true" /> 4.9★ ocena (2,800+ recenzija)</span>
          </div>
        </div>
        <div className="hero-image" aria-hidden="true">
          <FaInstagram className="instagram-icon" />
        </div>
      </header>

      {/* Trust Stats Section */}
      <section className="trust-stats-section" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">AIInstaMarketing u brojkama</h2>
        <div className="trust-stats-grid">
          {trustStats.map((stat, index) => (
            <div key={index} className="trust-stat-card">
              <stat.icon className="stat-icon" aria-hidden="true" />
              <span className="stat-number">{stat.number}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features" aria-labelledby="features-heading">
        <div className="section-header">
          <h2 id="features-heading">Kako AIInstaMarketing Pomaže Vašem Instagram Rastu?</h2>
          <p>Kompletan set AI alata za profesionalni Instagram marketing</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <article key={index} className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <feature.icon />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-keywords" aria-hidden="true">
                {feature.keywords.map((kw, i) => (
                  <span key={i} className="keyword-tag">{kw}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works - Step by Step for AI/GEO */}
      <section className="how-it-works" id="how-it-works" aria-labelledby="how-it-works-heading">
        <div className="section-header">
          <h2 id="how-it-works-heading">Kako Početi sa AIInstaMarketing?</h2>
          <p>Automatizujte Instagram marketing u samo 5 koraka</p>
        </div>
        <ol className="steps">
          <li className="step" id="step-1">
            <div className="step-number" aria-hidden="true">1</div>
            <h3>Registrujte Se Besplatno</h3>
            <p>Kreirajte nalog za manje od 1 minuta. Bez kreditne kartice, bez obaveza.</p>
          </li>
          <li className="step" id="step-2">
            <div className="step-number" aria-hidden="true">2</div>
            <h3>Povežite Instagram Nalog</h3>
            <p>Sigurno povežite vaš Instagram Business nalog putem zvaničnog Meta API-ja.</p>
          </li>
          <li className="step" id="step-3">
            <div className="step-number" aria-hidden="true">3</div>
            <h3>Kreirajte AI Sadržaj</h3>
            <p>Generišite video, captione i hashtag-ove pomoću naših naprednih AI alata.</p>
          </li>
          <li className="step" id="step-4">
            <div className="step-number" aria-hidden="true">4</div>
            <h3>Zakažite Objave</h3>
            <p>Postavite raspored objavljivanja. AI predlaže optimalno vreme za vašu publiku.</p>
          </li>
          <li className="step" id="step-5">
            <div className="step-number" aria-hidden="true">5</div>
            <h3>Pratite i Optimizujte</h3>
            <p>Analizirajte rezultate i prilagodite strategiju na osnovu AI preporuka.</p>
          </li>
        </ol>
        <div className="steps-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Započnite Sada - Besplatno <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Testimonials for E-E-A-T */}
      <section className="testimonials-section" aria-labelledby="testimonials-heading">
        <div className="section-header">
          <h2 id="testimonials-heading">Šta Kažu Naši Korisnici?</h2>
          <p>Pridružite se hiljadama zadovoljnih korisnika širom regiona</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <article key={index} className="testimonial-card">
              <FaQuoteLeft className="quote-icon" aria-hidden="true" />
              <p className="testimonial-text">{testimonial.text}</p>
              <div className="testimonial-author">
                <div className="author-info">
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
                <div className="testimonial-rating" aria-label={`Ocena: ${testimonial.rating} od 5`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} aria-hidden="true" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing" aria-labelledby="pricing-heading">
        <div className="section-header">
          <h2 id="pricing-heading">Transparentne Cene, Bez Skrivenih Troškova</h2>
          <p>Izaberite plan koji odgovara vašim potrebama. 14 dana Pro besplatno!</p>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <article key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Najpopularniji</div>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="currency">RSD</span>
                <span className="period">/{plan.period}</span>
              </div>
              <ul className="features-list">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <FiCheck aria-hidden="true" /> {feature}
                  </li>
                ))}
              </ul>
              <Link to={plan.link || "/register"} className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} btn-full`} aria-label={`Izaberite ${plan.name} plan`}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ Section - Critical for AEO/GEO */}
      <section className="faq-section" id="faq" aria-labelledby="faq-heading">
        <div className="section-header">
          <h2 id="faq-heading">Često Postavljana Pitanja o AIInstaMarketing</h2>
          <p>Sve što trebate znati o našoj AI Instagram marketing platformi</p>
        </div>
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <article key={index} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section" aria-labelledby="cta-heading">
        <h2 id="cta-heading">Spremni da Transformišete Vaš Instagram Marketing?</h2>
        <p>Pridružite se 15,000+ korisnika koji već koriste AI za Instagram uspeh</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary btn-lg">
            Započnite Besplatno - 14 Dana Pro <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
        <p className="cta-note">Bez kreditne kartice • Otkazivanje u bilo kom trenutku • 24/7 podrška</p>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <FaInstagram className="footer-logo" aria-hidden="true" />
            <span>AIInstaMarketing</span>
          </div>
          <nav className="footer-links" aria-label="Footer navigacija">
            <Link to="/about">O Nama</Link>
            <Link to="/contact">Kontakt</Link>
            <Link to="/pricing">Cene</Link>
            <Link to="/login">Prijava</Link>
            <Link to="/register">Registracija</Link>
          </nav>
          <div className="footer-bottom">
            <p>© 2025 AIInstaMarketing. Sva prava zadržana.</p>
            <p className="footer-trust">
              <FiShield aria-hidden="true" /> Meta Business Partner • ISO 27001 Certified • GDPR Compliant
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
