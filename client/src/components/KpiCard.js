import React from 'react';
import './KpiCard.css';

/**
 * Modern SaaS-style KPI Card Component
 * 
 * @param {string} label - Small uppercase label text
 * @param {string|number} value - Large bold number/value
 * @param {React.ReactNode} icon - Icon component (e.g., from react-icons)
 * @param {string} iconColor - Color class: 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'red'
 * @param {string} subtitle - Optional small text below the value
 */
const KpiCard = ({ label, value, icon, iconColor = 'blue', subtitle }) => {
  return (
    <div className="kpi-card-modern">
      <div className={`kpi-card-icon ${iconColor}`}>
        {icon}
      </div>
      <div className="kpi-card-content">
        <span className="kpi-card-label">{label}</span>
        <span className="kpi-card-value">{value}</span>
        {subtitle && <span className="kpi-card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};

/**
 * Responsive grid container for KPI cards
 */
export const KpiGrid = ({ children }) => {
  return (
    <div className="kpi-grid-modern">
      {children}
    </div>
  );
};

export default KpiCard;
