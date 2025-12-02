import React from 'react';
import './DashboardHeader.css';

/**
 * Dashboard Header Component
 * Compact, modern design with greeting
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
    </header>
  );
};

export default DashboardHeader;
