import React from 'react';
import { FiUsers, FiTarget, FiAward, FiTrendingUp } from 'react-icons/fi';
import SEO from '../components/SEO';
import './About.css';

const About = () => {
  const stats = [
    { number: '10k+', label: 'Korisnika' },
    { number: '1M+', label: 'Objava' },
    { number: '50+', label: 'Zemalja' },
    { number: '24/7', label: 'Podrška' }
  ];

  const values = [
    {
      icon: FiUsers,
      title: 'Korisnik na prvom mestu',
      description: 'Sve što radimo, radimo sa ciljem da pomognemo našim korisnicima da uspeju.'
    },
    {
      icon: FiTarget,
      title: 'Inovacija',
      description: 'Stalno unapređujemo našu platformu najnovijim AI tehnologijama.'
    },
    {
      icon: FiAward,
      title: 'Kvalitet',
      description: 'Ne pravimo kompromise kada je u pitanju kvalitet i pouzdanost naših alata.'
    },
    {
      icon: FiTrendingUp,
      title: 'Rast',
      description: 'Posvećeni smo rastu vašeg biznisa kroz pametnu automatizaciju.'
    }
  ];

  return (
    <main className="about-page">
      <SEO 
        title="O Nama - InstaMarketing"
        description="Upoznajte tim koji stoji iza InstaMarketing platforme. Naša misija je da demokratizujemo pristup naprednim marketinškim alatima."
        keywords="o nama, instamarketing tim, misija, vizija, instagram marketing srbija"
        url="/about"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'O Nama', url: '/about' }
        ]}
      />

      {/* Hero Section */}
      <header className="about-hero">
        <div className="hero-content">
          <h1>Naša Misija je Vaš Uspeh</h1>
          <p>
            InstaMarketing je nastao sa jednostavnom idejom: učiniti profesionalne 
            marketinške alate dostupnim svima. Danas pomažemo hiljadama biznisa 
            da rastu na društvenim mrežama.
          </p>
        </div>
      </header>

      {/* Stats Section */}
      <section className="stats-section" aria-label="Statistika">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-number">{stat.number}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="story-content">
          <h2>Naša Priča</h2>
          <p>
            Osnovani 2024. godine u Beogradu, prepoznali smo potrebu za alatom koji bi 
            ujedinio kreiranje sadržaja, zakazivanje i analitiku na jednom mestu.
          </p>
          <p>
            Danas, naš tim inženjera i marketara radi neumorno na integraciji najnovijih 
            AI tehnologija kako bi vam uštedeli vreme i poboljšali rezultate. Verujemo 
            da budućnost marketinga leži u simbiozi ljudske kreativnosti i veštačke inteligencije.
          </p>
        </div>
        <div className="story-image" aria-hidden="true">
          {/* Placeholder for team image or illustration */}
          <div className="image-placeholder"></div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section" aria-labelledby="values-heading">
        <h2 id="values-heading">Naše Vrednosti</h2>
        <div className="values-grid">
          {values.map((value, index) => (
            <article key={index} className="value-card">
              <div className="value-icon" aria-hidden="true">
                <value.icon />
              </div>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default About;
