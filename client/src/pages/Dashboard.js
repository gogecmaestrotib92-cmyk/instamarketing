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
    <main className="dashboard">
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
      <header className="page-header">
        <div>
          <h1 className="gradient-text">Dobrodošli nazad, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Evo šta se dešava sa vašim Instagram-om</p>
        </div>
        <div className="header-actions">
          <Link to="/posts/create" className="btn btn-primary" aria-label="Kreiraj novu objavu">
            <FiPlus aria-hidden="true" /> Kreiraj Objavu
          </Link>
        </div>
      </header>

      {/* Instagram Connection Status */}
      {!data?.account?.connected && (
        <section className="alert alert-warning" aria-label="Upozorenje o povezivanju naloga">
          <FiAlertCircle aria-hidden="true" />
          <div>
            <strong>Povežite Vaš Instagram Nalog</strong>
            <p>Povežite vaš Instagram Business nalog da biste počeli sa objavljivanjem i praćenjem analitike.</p>
          </div>
          <Link to="/settings" className="btn btn-secondary btn-sm">Poveži Sada</Link>
        </section>
      )}

      {/* Stats Grid */}
      <section className="stats-grid" aria-label="Statistika">
        <article className="stat-card">
          <div className="stat-icon posts" aria-hidden="true">
            <FiImage />
          </div>
          <div className="stat-content">
            <span className="stat-value">{data?.overview?.posts?.total || 0}</span>
            <h2 className="stat-label">Total Posts</h2>
          </div>
          <div className="stat-meta">
            <span className="badge badge-success">{data?.overview?.posts?.published || 0} Published</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon reels" aria-hidden="true">
            <FiFilm />
          </div>
          <div className="stat-content">
            <span className="stat-value">{data?.overview?.reels?.total || 0}</span>
            <h2 className="stat-label">Total Reels</h2>
          </div>
          <div className="stat-meta">
            <span className="badge badge-success">{data?.overview?.reels?.published || 0} Published</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon campaigns" aria-hidden="true">
            <FiTarget />
          </div>
          <div className="stat-content">
            <span className="stat-value">{data?.overview?.campaigns?.total || 0}</span>
            <h2 className="stat-label">Campaigns</h2>
          </div>
          <div className="stat-meta">
            <span className="badge badge-info">{data?.overview?.campaigns?.active || 0} Active</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon scheduled" aria-hidden="true">
            <FiCalendar />
          </div>
          <div className="stat-content">
            <span className="stat-value">{data?.overview?.posts?.scheduled || 0}</span>
            <h2 className="stat-label">Scheduled</h2>
          </div>
          <div className="stat-meta">
            <span className="badge badge-warning">Upcoming</span>
          </div>
        </article>
      </section>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Engagement Overview */}
        <section className="card engagement-card" aria-labelledby="engagement-heading">
          <div className="card-header">
            <h2 id="engagement-heading" className="card-title">Engagement Overview</h2>
            <FiTrendingUp className="card-icon" aria-hidden="true" />
          </div>
          <div className="engagement-stats">
            <div className="engagement-item">
              <FiHeart className="engagement-icon likes" aria-hidden="true" />
              <div className="engagement-data">
                <span className="engagement-value">{data?.contentMetrics?.likes?.toLocaleString() || 0}</span>
                <span className="engagement-label">Likes</span>
              </div>
            </div>
            <div className="engagement-item">
              <FiMessageCircle className="engagement-icon comments" aria-hidden="true" />
              <div className="engagement-data">
                <span className="engagement-value">{data?.contentMetrics?.comments?.toLocaleString() || 0}</span>
                <span className="engagement-label">Comments</span>
              </div>
            </div>
            <div className="engagement-item">
              <FiEye className="engagement-icon reach" aria-hidden="true" />
              <div className="engagement-data">
                <span className="engagement-value">{data?.contentMetrics?.reach?.toLocaleString() || 0}</span>
                <span className="engagement-label">Reach</span>
              </div>
            </div>
          </div>
        </section>

        {/* Account Info */}
        <section className="card account-card" aria-labelledby="account-heading">
          <div className="card-header">
            <h2 id="account-heading" className="card-title">Instagram Account</h2>
            <FaInstagram className="card-icon instagram" aria-hidden="true" />
          </div>
          {data?.account?.connected ? (
            <div className="account-info">
              <div className="account-avatar" aria-hidden="true">
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
        </section>

        {/* Campaign Performance */}
        <section className="card campaign-card" aria-labelledby="campaign-heading">
          <div className="card-header">
            <h2 id="campaign-heading" className="card-title">Campaign Performance</h2>
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
        </section>

        {/* Quick Actions */}
        <nav className="card quick-actions-card" aria-labelledby="actions-heading">
          <div className="card-header">
            <h2 id="actions-heading" className="card-title">Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <Link to="/posts/create" className="quick-action">
              <FiImage aria-hidden="true" />
              <span>New Post</span>
            </Link>
            <Link to="/reels/create" className="quick-action">
              <FiFilm aria-hidden="true" />
              <span>New Reel</span>
            </Link>
            <Link to="/campaigns/create" className="quick-action">
              <FiTarget aria-hidden="true" />
              <span>New Campaign</span>
            </Link>
            <Link to="/schedule" className="quick-action">
              <FiCalendar aria-hidden="true" />
              <span>View Schedule</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Recent Content */}
      <section className="card recent-content-card" aria-labelledby="recent-heading">
        <div className="card-header">
          <h2 id="recent-heading" className="card-title">Recent Published Content</h2>
          <Link to="/posts" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        <div className="recent-content-list">
          {data?.recentContent?.posts?.length > 0 ? (
            data.recentContent.posts.map((post, index) => (
              <article key={index} className="recent-item">
                <div className="recent-item-icon" aria-hidden="true">
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
                  <span aria-label={`${post.metrics?.likes || 0} likes`}><FiHeart aria-hidden="true" /> {post.metrics?.likes || 0}</span>
                  <span aria-label={`${post.metrics?.comments || 0} comments`}><FiMessageCircle aria-hidden="true" /> {post.metrics?.comments || 0}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <p>No published content yet</p>
              <Link to="/posts/create" className="btn btn-primary btn-sm">Create Your First Post</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
