import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiVideo, FiTarget, FiImage, FiArrowRight } from 'react-icons/fi';
import './BusinessCreate.css';

const BusinessCreate = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 'trending',
      icon: FiTrendingUp,
      title: 'Trending',
      subtitle: 'Voiceover Video',
      description: 'Faceless subtitle videos & AI voices. Create engaging content with trending topics.',
      color: '#8b5cf6',
      path: '/app/create/business/trending',
      isLive: true // ✅ Feature is fully functional
    },
    {
      id: 'video',
      icon: FiVideo,
      title: 'Video',
      subtitle: 'Promo Videos',
      description: 'Short, impactful promo videos. Perfect for social media marketing.',
      color: '#3b82f6',
      path: '/app/create/business/video',
      isLive: false
    },
    {
      id: 'image',
      icon: FiImage,
      title: 'Image',
      subtitle: 'AD & Stacking Design',
      description: 'Create stunning ad images and stacking designs for your business campaigns.',
      color: '#10b981',
      path: '/app/create/business/image',
      isLive: false
    },
    {
      id: 'ad-creatives',
      icon: FiTarget,
      title: 'Ad Creatives',
      subtitle: 'Business Ads',
      description: 'Professional ads for your business. Boost engagement and conversions.',
      color: '#f59e0b',
      path: '/app/create/business/ad-creatives',
      isLive: false
    }
  ];

  return (
    <div className="business-create-page">
      <div className="business-create-container">
        <div className="page-header">
          <h1>Business Content</h1>
          <p>Create professional content for your business</p>
        </div>

        <div className="business-cards-grid">
          {cards.map((card) => (
            <div
              key={card.id}
              className="business-card"
              onClick={() => navigate(card.path)}
              style={{ '--card-color': card.color }}
            >
              {card.isLive && (
                <div className="live-indicator" title="Feature is live!">
                  <span className="live-dot"></span>
                  <span className="live-text">LIVE</span>
                </div>
              )}
              <div className="card-icon-wrapper">
                <card.icon className="card-icon" />
              </div>
              <div className="card-content">
                <h3>{card.title}</h3>
                <span className="card-subtitle">{card.subtitle}</span>
                <p>{card.description}</p>
              </div>
              <div className="card-arrow">
                <FiArrowRight />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessCreate;
