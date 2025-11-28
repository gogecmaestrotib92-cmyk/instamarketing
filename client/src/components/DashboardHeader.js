import React from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiZap, FiImage, FiFilm } from 'react-icons/fi';
import './DashboardHeader.css';

/**
 * Dashboard Header Component
 * Compact, modern design with greeting and quick actions
 * 
 * @param {string} userName - User's display name
 */
const DashboardHeader = ({ userName = 'User' }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = userName?.split(' ')[0] || 'User';

  return (
    <header className="dash-header">
      <div className="dash-header-left">
        <h1>{getGreeting()}, {firstName}</h1>
        <p>Your Instagram account overview</p>
      </div>
      
      <div className="dash-header-actions">
        <Link to="/posts/create" className="header-btn header-btn-ghost">
          <FiImage />
          <span>Post</span>
        </Link>
        <Link to="/reels/create" className="header-btn header-btn-ghost">
          <FiFilm />
          <span>Reel</span>
        </Link>
        <Link to="/app/ai-video" className="header-btn header-btn-secondary">
          <FiZap />
          <span>AI Video</span>
        </Link>
        <Link to="/posts/create" className="header-btn header-btn-primary">
          <FiPlus />
          <span>New Post</span>
        </Link>
      </div>
    </header>
  );
};

export default DashboardHeader;
