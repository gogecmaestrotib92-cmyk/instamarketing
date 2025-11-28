import React from 'react';
import './KpiCard.css';

/**
 * Premium SaaS-style KPI Card
 * Clean, minimal design - no icons, subtle borders
 * 
 * @param {string} label - Small uppercase label
 * @param {string|number} value - Large bold number
 * @param {string} change - Optional change indicator (e.g., "+12%")
 * @param {string} trend - 'up' | 'down' | 'neutral'
 */
const KpiCard = ({ label, value, change, trend = 'neutral' }) => {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <div className="kpi-value-row">
        <span className="kpi-value">{value}</span>
        {change && (
          <span className={`kpi-change ${trend}`}>{change}</span>
        )}
      </div>
    </div>
  );
};

/**
 * KPI Row - Responsive grid of 4-5 KPI cards
 * Use as: <KpiRow data={[{ label, value, change, trend }]} />
 */
export const KpiRow = ({ data = [] }) => {
  return (
    <div className="kpi-row">
      {data.map((item, index) => (
        <KpiCard
          key={index}
          label={item.label}
          value={item.value}
          change={item.change}
          trend={item.trend}
        />
      ))}
    </div>
  );
};

/**
 * @deprecated Use KpiRow instead
 */
export const KpiGrid = ({ children }) => {
  return <div className="kpi-row">{children}</div>;
};

export default KpiCard;
