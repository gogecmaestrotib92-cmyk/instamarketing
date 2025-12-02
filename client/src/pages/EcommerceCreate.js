import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBox, FiLayers, FiFilm, FiCamera, FiArrowRight } from 'react-icons/fi';
import './EcommerceCreate.css';

const EcommerceCreate = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 'product-creatives',
      icon: FiBox,
      title: 'Product Creatives',
      subtitle: 'Static Ads',
      description: 'Convert your products to stunning static ads. Perfect for social media and display advertising.',
      color: '#10b981',
      path: '/app/create/ecommerce/product-creatives'
    },
    {
      id: 'product-carousels',
      icon: FiLayers,
      title: 'Product Carousels',
      subtitle: 'Carousel Slides',
      description: 'Transform products into engaging carousel slides. Showcase multiple angles and features.',
      color: '#6366f1',
      path: '/app/create/ecommerce/product-carousels'
    },
    {
      id: 'product-videos',
      icon: FiFilm,
      title: 'Product Videos',
      subtitle: 'Animated Videos',
      description: 'Create short animated product videos. Bring your products to life with motion.',
      color: '#ec4899',
      path: '/app/create/ecommerce/product-videos'
    },
    {
      id: 'product-photoshoot',
      icon: FiCamera,
      title: 'Product Photo Shoot',
      subtitle: 'AI Backgrounds',
      description: 'Professional product photos with AI-generated backgrounds. Studio quality without the studio.',
      color: '#f59e0b',
      path: '/app/create/ecommerce/product-photoshoot'
    }
  ];

  return (
    <div className="ecommerce-create-page">
      <div className="ecommerce-create-container">
        <div className="page-header">
          <h1>E-Commerce Content</h1>
          <p>Create stunning visuals for your products</p>
        </div>

        <div className="ecommerce-cards-grid">
          {cards.map((card) => (
            <div
              key={card.id}
              className="ecommerce-card"
              onClick={() => navigate(card.path)}
              style={{ '--card-color': card.color }}
            >
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

export default EcommerceCreate;
