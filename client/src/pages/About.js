import React from 'react';
import { FiUsers, FiTarget, FiAward, FiTrendingUp } from 'react-icons/fi';
import SEO from '../components/SEO';
import './About.css';

const About = () => {
  const stats = [
    { number: '10k+', label: 'Users' },
    { number: '1M+', label: 'Posts' },
    { number: '50+', label: 'Countries' },
    { number: '24/7', label: 'Support' }
  ];

  const values = [
    {
      icon: FiUsers,
      title: 'Customer First',
      description: 'Everything we do, we do with the goal of helping our users succeed.'
    },
    {
      icon: FiTarget,
      title: 'Innovation',
      description: 'We constantly improve our platform with the latest AI technologies.'
    },
    {
      icon: FiAward,
      title: 'Quality',
      description: 'We don\'t compromise when it comes to quality and reliability of our tools.'
    },
    {
      icon: FiTrendingUp,
      title: 'Growth',
      description: 'We are dedicated to growing your business through smart automation.'
    }
  ];

  return (
    <main className="about-page">
      <SEO 
        title="About Us - InstaMarketing"
        description="Meet the team behind the InstaMarketing platform. Our mission is to democratize access to advanced marketing tools."
        keywords="about us, instamarketing team, mission, vision, instagram marketing"
        url="/about"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'About Us', url: '/about' }
        ]}
      />

      {/* Hero Section */}
      <header className="about-hero">
        <div className="hero-content">
          <h1>Our Mission is Your Success</h1>
          <p>
            InstaMarketing was created with a simple idea: make professional 
            marketing tools accessible to everyone. Today we help thousands of businesses 
            grow on social media.
          </p>
        </div>
      </header>

      {/* Stats Section */}
      <section className="stats-section" aria-label="Statistics">
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
          <h2>Our Story</h2>
          <p>
            Founded in 2024 in Belgrade, we recognized the need for a tool that would 
            unify content creation, scheduling and analytics in one place.
          </p>
          <p>
            Today, our team of engineers and marketers works tirelessly to integrate the latest 
            AI technologies to save you time and improve results. We believe 
            that the future of marketing lies in the symbiosis of human creativity and artificial intelligence.
          </p>
        </div>
        <div className="story-image" aria-hidden="true">
          {/* Placeholder for team image or illustration */}
          <div className="image-placeholder"></div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section" aria-labelledby="values-heading">
        <h2 id="values-heading">Our Values</h2>
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
