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
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  FiTrendingUp, 
  FiHeart, 
  FiMessageCircle, 
  FiEye,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <main className="analytics-page">
      <SEO 
        title="Instagram Analytics"
        description="In-depth Instagram performance analysis. Track engagement rate, reach, impressions, follower growth and ad campaign ROI. Detailed reports and statistics."
        keywords="instagram analytics, instagram statistics, engagement rate, reach analysis, ROI tracking, instagram reports, instagram performance"
        url="/analytics"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Analytics', url: '/analytics' }
        ]}
        noindex={true}
      />
      <header className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="page-subtitle">Track your Instagram performance</p>
        </div>
        <nav className="period-selector" aria-label="Period selection">
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPeriod(p)}
              aria-current={period === p ? 'page' : undefined}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </nav>
      </header>

      {/* Overview Stats */}
      <section className="stats-grid" aria-label="Statistics overview">
        <article className="stat-card">
          <FiHeart className="stat-icon-large" style={{ color: 'var(--error)' }} aria-hidden="true" />
          <div className="stat-data">
            <span className="stat-value">{metrics.likes?.toLocaleString() || 0}</span>
            <h2 className="stat-label">Total Likes</h2>
          </div>
        </article>
        <article className="stat-card">
          <FiMessageCircle className="stat-icon-large" style={{ color: 'var(--info)' }} aria-hidden="true" />
          <div className="stat-data">
            <span className="stat-value">{metrics.comments?.toLocaleString() || 0}</span>
            <h2 className="stat-label">Total Comments</h2>
          </div>
        </article>
        <article className="stat-card">
          <FiEye className="stat-icon-large" style={{ color: 'var(--success)' }} aria-hidden="true" />
          <div className="stat-data">
            <span className="stat-value">{metrics.reach?.toLocaleString() || 0}</span>
            <h2 className="stat-label">Total Reach</h2>
          </div>
        </article>
        <article className="stat-card">
          <FiBookmark className="stat-icon-large" style={{ color: 'var(--warning)' }} aria-hidden="true" />
          <div className="stat-data">
            <span className="stat-value">{metrics.saves?.toLocaleString() || 0}</span>
            <h2 className="stat-label">Total Saves</h2>
          </div>
        </article>
      </section>

      <div className="analytics-grid">
        {/* Engagement Breakdown */}
        <section className="card" aria-labelledby="engagement-heading">
          <h3 id="engagement-heading" className="card-title">Engagement Breakdown</h3>
          <div className="chart-container doughnut" aria-label="Engagement breakdown chart">
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
        </section>

        {/* Best Posting Times */}
        <section className="card" aria-labelledby="times-heading">
          <h3 id="times-heading" className="card-title">
            <FiClock aria-hidden="true" /> Best Posting Times
          </h3>
          {bestTimesData ? (
            <div className="chart-container" aria-label="Best posting times chart">
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
        </section>

        {/* Top Performing Content */}
        <section className="card full-width" aria-labelledby="top-content-heading">
          <h3 id="top-content-heading" className="card-title">
            <FiTrendingUp aria-hidden="true" /> Top Performing Content
          </h3>
          {topContent.length > 0 ? (
            <div className="table-responsive">
              <table className="content-table">
                <thead>
                  <tr>
                    <th scope="col">Content</th>
                    <th scope="col">Type</th>
                    <th scope="col">Likes</th>
                    <th scope="col">Comments</th>
                    <th scope="col">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {topContent.map((item, idx) => (
                    <tr key={idx}>
                      <td className="content-preview-cell">
                        {item.caption?.substring(0, 40) || 'No caption'}...
                      </td>
                      <td><span className="badge badge-default">{item.contentType}</span></td>
                      <td>{item.metrics?.likes || 0}</td>
                      <td>{item.metrics?.comments || 0}</td>
                      <td className="engagement-score">{item.engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No published content yet</p>
          )}
        </section>

        {/* Best Days */}
        {bestTimes?.recommendations?.bestDays?.length > 0 && (
          <section className="card" aria-labelledby="best-days-heading">
            <h3 id="best-days-heading" className="card-title">Best Days to Post</h3>
            <div className="best-days">
              {bestTimes.recommendations.bestDays.map((day, idx) => (
                <div key={idx} className="best-day">
                  <span className="day-name">{day.day}</span>
                  <div className="day-bar" role="progressbar" aria-valuenow={Math.round(day.averageEngagement)} aria-valuemin="0" aria-valuemax={Math.round(bestTimes.recommendations.bestDays[0].averageEngagement)}>
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
          </section>
        )}
      </div>
    </main>
  );
};

export default Analytics;
