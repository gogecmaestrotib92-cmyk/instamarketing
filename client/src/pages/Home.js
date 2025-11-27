import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaRobot, FaChartLine, FaCalendarAlt, FaBullhorn, FaVideo } from 'react-icons/fa';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import SEO from '../components/SEO';
import './Home.css';

const Home = () => {
  const features = [
    {
      icon: FaCalendarAlt,
      title: 'Zakazivanje Objava',
      description: 'Zakazujte Instagram objave i rilsove unapred. Automatsko objavljivanje u optimalno vreme za maksimalan engagement.'
    },
    {
      icon: FaRobot,
      title: 'AI Generisanje Sadržaja',
      description: 'Koristite veštačku inteligenciju za kreiranje captiona, hashtag-ova, skripti i video sadržaja.'
    },
    {
      icon: FaVideo,
      title: 'AI Video Kreator',
      description: 'Kreirajte profesionalne rilsove sa AI generisanim videom, voiceoverom i titlovima.'
    },
    {
      icon: FaChartLine,
      title: 'Napredna Analitika',
      description: 'Pratite engagement, reach, rast pratilaca i ROI vaših kampanja u realnom vremenu.'
    },
    {
      icon: FaBullhorn,
      title: 'Reklamne Kampanje',
      description: 'Kreirajte i upravljajte Instagram reklamama. A/B testiranje i optimizacija budžeta.'
    },
    {
      icon: FaInstagram,
      title: 'Instagram API',
      description: 'Direktna integracija sa Instagram Business API za pouzdano objavljivanje sadržaja.'
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
        'AI Video generator',
        'Napredna analitika',
        'Reklamne kampanje',
        'Prioritetna podrška'
      ],
      cta: 'Započni Pro',
      popular: true
    },
    {
      name: 'Business',
      price: '7,990',
      period: 'mesečno',
      features: [
        'Sve iz Pro plana',
        'Do 10 Instagram naloga',
        'Tim pristup',
        'API pristup',
        'Dedicirani account manager',
        'Custom integracije'
      ],
      cta: 'Kontaktirajte Nas',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'Šta je InstaMarketing?',
      answer: 'InstaMarketing je platforma za automatizaciju Instagram marketinga koja koristi AI tehnologiju za kreiranje sadržaja, zakazivanje objava, analizu performansi i vođenje reklamnih kampanja.'
    },
    {
      question: 'Da li je InstaMarketing besplatan?',
      answer: 'Da, InstaMarketing nudi besplatan plan sa osnovnim funkcijama. Premium planovi sa naprednim AI alatima i neograničenim objavama su dostupni po pristupačnim cenama.'
    },
    {
      question: 'Kako da povežem Instagram nalog?',
      answer: 'Nakon registracije, idite u Podešavanja i kliknite na "Poveži Instagram". Bićete preusmereni na Facebook/Instagram autorizaciju gde odobravate pristup vašem poslovnom nalogu.'
    },
    {
      question: 'Da li InstaMarketing podržava Instagram Reels?',
      answer: 'Da, InstaMarketing ima potpunu podršku za Instagram Reels uključujući AI generisanje video sadržaja, automatsko dodavanje titlova, muzike i zakazivanje objava.'
    },
    {
      question: 'Kako funkcioniše AI generisanje sadržaja?',
      answer: 'Naši AI alati koriste napredne modele veštačke inteligencije (GPT-4) za generisanje captiona, hashtag-ova, skripti za video, pa čak i samog video sadržaja na osnovu vaših uputstava.'
    },
    {
      question: 'Da li mogu da zakazujem objave unapred?',
      answer: 'Da, možete zakazati neograničen broj objava unapred. Naš scheduler automatski objavljuje sadržaj u optimalno vreme za maksimalan engagement.'
    }
  ];

  return (
    <div className="home-page">
      <SEO 
        title="Automatizacija Instagram Marketinga"
        description="Automatizujte Instagram marketing pomoću AI tehnologije. Zakazujte objave, kreirajte rilsove, vodite reklamne kampanje i analizirajte rezultate. #1 alat u Srbiji."
        keywords="instagram marketing, automatizacija instagram, zakazivanje objava, instagram analitika, reklamne kampanje instagram, AI marketing, social media marketing srbija"
        url="/"
        faq={faqs}
      />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🇷🇸 #1 u Srbiji</div>
          <h1>
            Automatizujte Vaš <span className="gradient-text">Instagram Marketing</span>
          </h1>
          <p className="hero-subtitle">
            Zakazujte objave, kreirajte AI sadržaj, vodite reklamne kampanje i 
            povećajte vašu publiku 10x brže sa InstaMarketing platformom.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Započnite Besplatno <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Prijavite Se
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Korisnika</span>
            </div>
            <div className="stat">
              <span className="stat-number">1M+</span>
              <span className="stat-label">Objava</span>
            </div>
            <div className="stat">
              <span className="stat-number">4.8⭐</span>
              <span className="stat-label">Ocena</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <FaInstagram className="instagram-icon" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2>Sve Što Vam Treba za Instagram Uspeh</h2>
          <p>Moćni alati za kreiranje, zakazivanje i analizu vašeg Instagram sadržaja</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <feature.icon />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>Kako Funkcioniše?</h2>
          <p>Počnite sa automatizacijom u samo 3 koraka</p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Registrujte Se</h3>
            <p>Kreirajte besplatan nalog za par minuta</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Povežite Instagram</h3>
            <p>Povežite vaš Instagram Business nalog</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Automatizujte</h3>
            <p>Zakazujte objave i koristite AI alate</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="section-header">
          <h2>Jednostavne Cene</h2>
          <p>Izaberite plan koji odgovara vašim potrebama</p>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
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
                    <FiCheck /> {feature}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} btn-full`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="section-header">
          <h2>Često Postavljana Pitanja</h2>
          <p>Odgovori na najčešća pitanja o InstaMarketing platformi</p>
        </div>
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Spremni da Povećate Vaš Instagram?</h2>
        <p>Pridružite se hiljadama zadovoljnih korisnika u Srbiji</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Započnite Besplatno Danas <FiArrowRight />
        </Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <FaInstagram className="footer-logo" />
            <span>InstaMarketing</span>
          </div>
          <div className="footer-links">
            <a href="#features">Funkcije</a>
            <a href="#pricing">Cene</a>
            <a href="#faq">FAQ</a>
            <Link to="/login">Prijava</Link>
            <Link to="/register">Registracija</Link>
          </div>
          <div className="footer-bottom">
            <p>© 2024 InstaMarketing. Sva prava zadržana. 🇷🇸 Napravljeno u Srbiji</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
