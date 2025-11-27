import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  FiTrendingUp, 
  FiHeart, 
  FiMessageCircle, 
  FiEye,
  FiShare2,
  FiBookmark,
  FiClock
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [contentData, setContentData] = useState([]);
  const [bestTimes, setBestTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [dashboard, content, times] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getContent({ period }),
        analyticsAPI.getBestTimes()
      ]);
      
      setDashboardData(dashboard.data);
      setContentData(content.data.content || []);
      setBestTimes(times.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const metrics = dashboardData?.contentMetrics || {};

  // Engagement chart data
  const engagementData = {
    labels: ['Likes', 'Comments', 'Shares', 'Saves'],
    datasets: [{
      data: [
        metrics.likes || 0,
        metrics.comments || 0,
        metrics.shares || 0,
        metrics.saves || 0
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(34, 197, 94, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  // Best times chart
  const bestTimesData = bestTimes ? {
    labels: bestTimes.hourlyAnalysis?.map(h => `${h.hour}:00`) || [],
    datasets: [{
      label: 'Average Engagement',
      data: bestTimes.hourlyAnalysis?.map(h => h.averageEngagement) || [],
      borderColor: 'rgba(225, 48, 108, 1)',
      backgroundColor: 'rgba(225, 48, 108, 0.1)',
      fill: true,
      tension: 0.4
    }]
  } : null;

  // Content performance data
  const topContent = contentData.slice(0, 5);

  return (
    <div className="analytics-page">
      <SEO 
        title="Instagram Analitika"
        description="Dubinska analiza Instagram performansi. Pratite engagement rate, reach, impressions, rast pratilaca i ROI reklamnih kampanja. Detaljni izveštaji i statistika."
        keywords="instagram analitika, instagram statistika, engagement rate, reach analiza, ROI praćenje, izveštaji instagram, performanse instagram"
        url="/analytics"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'Analitika', url: '/analytics' }
        ]}
        noindex={true}
      />
      <div className="page-header">
        <div>
          <h1>Analitika</h1>
          <p className="page-subtitle">Pratite performanse vašeg Instagram-a</p>
        </div>
        <div className="period-selector">
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7 Dana' : p === '30d' ? '30 Dana' : '90 Dana'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <FiHeart className="stat-icon-large" style={{ color: 'var(--error)' }} />
          <div className="stat-data">
            <span className="stat-value">{metrics.likes?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Likes</span>
          </div>
        </div>
        <div className="stat-card">
          <FiMessageCircle className="stat-icon-large" style={{ color: 'var(--info)' }} />
          <div className="stat-data">
            <span className="stat-value">{metrics.comments?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Comments</span>
          </div>
        </div>
        <div className="stat-card">
          <FiEye className="stat-icon-large" style={{ color: 'var(--success)' }} />
          <div className="stat-data">
            <span className="stat-value">{metrics.reach?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Reach</span>
          </div>
        </div>
        <div className="stat-card">
          <FiBookmark className="stat-icon-large" style={{ color: 'var(--warning)' }} />
          <div className="stat-data">
            <span className="stat-value">{metrics.saves?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Saves</span>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Engagement Breakdown */}
        <div className="card">
          <h3 className="card-title">Engagement Breakdown</h3>
          <div className="chart-container doughnut">
            <Doughnut 
              data={engagementData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#a0a0a0' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Best Posting Times */}
        <div className="card">
          <h3 className="card-title">
            <FiClock /> Best Posting Times
          </h3>
          {bestTimesData ? (
            <div className="chart-container">
              <Line 
                data={bestTimesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(255,255,255,0.1)' },
                      ticks: { color: '#a0a0a0' }
                    },
                    y: {
                      grid: { color: 'rgba(255,255,255,0.1)' },
                      ticks: { color: '#a0a0a0' }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="no-data">Not enough data yet</p>
          )}
          
          {bestTimes?.recommendations?.bestHours?.length > 0 && (
            <div className="recommendations">
              <h4>Recommended Times</h4>
              <div className="recommendation-list">
                {bestTimes.recommendations.bestHours.map((hour, idx) => (
                  <span key={idx} className="badge badge-success">
                    {hour.hour}:00
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Content */}
        <div className="card full-width">
          <h3 className="card-title">
            <FiTrendingUp /> Top Performing Content
          </h3>
          {topContent.length > 0 ? (
            <div className="content-table">
              <div className="table-header">
                <span>Content</span>
                <span>Type</span>
                <span>Likes</span>
                <span>Comments</span>
                <span>Engagement</span>
              </div>
              {topContent.map((item, idx) => (
                <div key={idx} className="table-row">
                  <span className="content-preview">
                    {item.caption?.substring(0, 40) || 'No caption'}...
                  </span>
                  <span className="badge badge-default">{item.contentType}</span>
                  <span>{item.metrics?.likes || 0}</span>
                  <span>{item.metrics?.comments || 0}</span>
                  <span className="engagement-score">{item.engagement}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No published content yet</p>
          )}
        </div>

        {/* Best Days */}
        {bestTimes?.recommendations?.bestDays?.length > 0 && (
          <div className="card">
            <h3 className="card-title">Best Days to Post</h3>
            <div className="best-days">
              {bestTimes.recommendations.bestDays.map((day, idx) => (
                <div key={idx} className="best-day">
                  <span className="day-name">{day.day}</span>
                  <div className="day-bar">
                    <div 
                      className="day-bar-fill" 
                      style={{ 
                        width: `${(day.averageEngagement / bestTimes.recommendations.bestDays[0].averageEngagement) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="day-engagement">{Math.round(day.averageEngagement)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
