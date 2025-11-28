import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';
import { 
  FiImage, 
  FiFilm, 
  FiTarget, 
  FiCalendar,
  FiTrendingUp,
  FiHeart,
  FiMessageCircle,
  FiEye,
  FiPlus,
  FiAlertCircle
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import SEO from '../components/SEO';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Show error to user if it's not a 401 (which redirects)
      if (error.response?.status !== 401) {
        // toast.error('Failed to load dashboard data. Please check your connection.');
      }
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

  return (
    <div className="dashboard">
      <SEO 
        title="Kontrolna Tabla"
        description="Upravljajte Instagram marketingom sa jedne kontrolne table. Pratite analitiku, zakazane objave i performanse kampanja u realnom vremenu."
        keywords="instagram dashboard, kontrolna tabla, instagram metrike, praćenje performansi, instagram statistika"
        url="/dashboard"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'Kontrolna Tabla', url: '/dashboard' }
        ]}
        noindex={true}
      />
      <div className="page-header">
        <div>
          <h1 className="gradient-text">Dobrodošli nazad, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Evo šta se dešava sa vašim Instagram-om</p>
        </div>
        <div className="header-actions">
          <Link to="/posts/create" className="btn btn-primary">
            <FiPlus /> Kreiraj Objavu
          </Link>
        </div>
      </div>

      {/* Instagram Connection Status */}
      {!data?.account?.connected && (
        <div className="alert alert-warning">
          <FiAlertCircle />
          <div>
            <strong>Povežite Vaš Instagram Nalog</strong>
            <p>Povežite vaš Instagram Business nalog da biste počeli sa objavljivanjem i praćenjem analitike.</p>
          </div>
          <Link to="/settings" className="btn btn-secondary btn-sm">Poveži Sada</Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon posts">
            <FiImage />
          </div>
          <div className="stat-content">
            <span className="stat-value">{data?.overview?.posts?.total || 0}</span>
            <span className="stat-label">Total Posts</span>
          </div>
          <div className="stat-meta">
            <span className="badge badge-success">{data?.overview?.posts?.published || 0} Published</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon reels">
            <FiFilm />
          </div>
          <div className="stat-content">
            <span className="stat-value">{data?.overview?.reels?.total || 0}</span>
            <span className="stat-label">Total Reels</span>
          </div>
          <div className="stat-meta">
            <span className="badge badge-success">{data?.overview?.reels?.published || 0} Published</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon campaigns">
            <FiTarget />
          </div>
          <div className="stat-content">
            <span className="stat-value">{data?.overview?.campaigns?.total || 0}</span>
            <span className="stat-label">Campaigns</span>
          </div>
          <div className="stat-meta">
            <span className="badge badge-info">{data?.overview?.campaigns?.active || 0} Active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon scheduled">
            <FiCalendar />
          </div>
          <div className="stat-content">
            <span className="stat-value">{data?.overview?.posts?.scheduled || 0}</span>
            <span className="stat-label">Scheduled</span>
          </div>
          <div className="stat-meta">
            <span className="badge badge-warning">Upcoming</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Engagement Overview */}
        <div className="card engagement-card">
          <div className="card-header">
            <h3 className="card-title">Engagement Overview</h3>
            <FiTrendingUp className="card-icon" />
          </div>
          <div className="engagement-stats">
            <div className="engagement-item">
              <FiHeart className="engagement-icon likes" />
              <div className="engagement-data">
                <span className="engagement-value">{data?.contentMetrics?.likes?.toLocaleString() || 0}</span>
                <span className="engagement-label">Likes</span>
              </div>
            </div>
            <div className="engagement-item">
              <FiMessageCircle className="engagement-icon comments" />
              <div className="engagement-data">
                <span className="engagement-value">{data?.contentMetrics?.comments?.toLocaleString() || 0}</span>
                <span className="engagement-label">Comments</span>
              </div>
            </div>
            <div className="engagement-item">
              <FiEye className="engagement-icon reach" />
              <div className="engagement-data">
                <span className="engagement-value">{data?.contentMetrics?.reach?.toLocaleString() || 0}</span>
                <span className="engagement-label">Reach</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card account-card">
          <div className="card-header">
            <h3 className="card-title">Instagram Account</h3>
            <FaInstagram className="card-icon instagram" />
          </div>
          {data?.account?.connected ? (
            <div className="account-info">
              <div className="account-avatar">
                {data.account.username?.charAt(0).toUpperCase() || 'I'}
              </div>
              <div className="account-details">
                <span className="account-username">@{data.account.username}</span>
                <span className="account-followers">
                  {data.account.followers?.toLocaleString() || 0} followers
                </span>
              </div>
              <span className="badge badge-success">Connected</span>
            </div>
          ) : (
            <div className="account-disconnected">
              <p>No Instagram account connected</p>
              <Link to="/settings" className="btn btn-secondary btn-sm">Connect Account</Link>
            </div>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="card campaign-card">
          <div className="card-header">
            <h3 className="card-title">Campaign Performance</h3>
            <Link to="/campaigns" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="campaign-stats">
            <div className="campaign-stat">
              <span className="campaign-value">${data?.campaignMetrics?.totalSpend?.toFixed(2) || '0.00'}</span>
              <span className="campaign-label">Total Spend</span>
            </div>
            <div className="campaign-stat">
              <span className="campaign-value">{data?.campaignMetrics?.totalImpressions?.toLocaleString() || 0}</span>
              <span className="campaign-label">Impressions</span>
            </div>
            <div className="campaign-stat">
              <span className="campaign-value">{data?.campaignMetrics?.totalClicks?.toLocaleString() || 0}</span>
              <span className="campaign-label">Clicks</span>
            </div>
            <div className="campaign-stat">
              <span className="campaign-value">{data?.campaignMetrics?.totalConversions || 0}</span>
              <span className="campaign-label">Conversions</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card quick-actions-card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <Link to="/posts/create" className="quick-action">
              <FiImage />
              <span>New Post</span>
            </Link>
            <Link to="/reels/create" className="quick-action">
              <FiFilm />
              <span>New Reel</span>
            </Link>
            <Link to="/campaigns/create" className="quick-action">
              <FiTarget />
              <span>New Campaign</span>
            </Link>
            <Link to="/schedule" className="quick-action">
              <FiCalendar />
              <span>View Schedule</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Content */}
      <div className="card recent-content-card">
        <div className="card-header">
          <h3 className="card-title">Recent Published Content</h3>
          <Link to="/posts" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        <div className="recent-content-list">
          {data?.recentContent?.posts?.length > 0 ? (
            data.recentContent.posts.map((post, index) => (
              <div key={index} className="recent-item">
                <div className="recent-item-icon">
                  <FiImage />
                </div>
                <div className="recent-item-content">
                  <p className="recent-item-caption">
                    {post.caption?.substring(0, 60) || 'No caption'}
                    {post.caption?.length > 60 ? '...' : ''}
                  </p>
                  <span className="recent-item-date">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="recent-item-stats">
                  <span><FiHeart /> {post.metrics?.likes || 0}</span>
                  <span><FiMessageCircle /> {post.metrics?.comments || 0}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No published content yet</p>
              <Link to="/posts/create" className="btn btn-primary btn-sm">Create Your First Post</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
