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
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiSettings,
  FiZap
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import SEO from '../components/SEO';
import KpiCard, { KpiGrid } from '../components/KpiCard';
import '../components/KpiCard.css';
import './Dashboard.css';

// ============================================================
// STATIC PLACEHOLDER DATA - Replace with your backend API calls
// ============================================================
const PLACEHOLDER_DATA = {
  user: {
    name: 'Marko Petrović'
  },
  overview: {
    posts: { total: 128, published: 115, scheduled: 13 },
    reels: { total: 45, published: 42 },
    campaigns: { total: 7, active: 3 }
  },
  account: {
    connected: true,
    username: 'your_brand',
    followers: 24500,
    profilePicture: null
  },
  contentMetrics: {
    likes: 45200,
    comments: 3840,
    reach: 128000,
    impressions: 256000
  },
  scheduledPosts: [
    { id: 1, type: 'post', caption: 'Exciting new product launch coming soon! Stay tuned for updates...', scheduledFor: '2025-11-29T10:00:00' },
    { id: 2, type: 'reel', caption: 'Behind the scenes of our latest shoot 🎬', scheduledFor: '2025-11-29T14:30:00' },
    { id: 3, type: 'post', caption: 'Customer spotlight: See how @client uses our product', scheduledFor: '2025-11-30T09:00:00' },
    { id: 4, type: 'reel', caption: 'Quick tips for better engagement', scheduledFor: '2025-11-30T16:00:00' },
    { id: 5, type: 'post', caption: 'Weekend vibes ✨ What are your plans?', scheduledFor: '2025-12-01T11:00:00' }
  ],
  recentCampaigns: [
    { id: 1, name: 'Black Friday Sale', status: 'active', budget: 500.00, impressions: 45000, clicks: 1250, conversions: 89 },
    { id: 2, name: 'Holiday Collection', status: 'active', budget: 750.00, impressions: 62000, clicks: 2100, conversions: 156 },
    { id: 3, name: 'Brand Awareness Q4', status: 'active', budget: 1200.00, impressions: 128000, clicks: 3400, conversions: 210 },
    { id: 4, name: 'Summer Promo', status: 'completed', budget: 400.00, impressions: 38000, clicks: 980, conversions: 67 },
    { id: 5, name: 'Product Launch', status: 'paused', budget: 600.00, impressions: 52000, clicks: 1800, conversions: 124 }
  ]
};

const Dashboard = () => {
  const { user: authUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: Replace with your actual API call
      // const response = await analyticsAPI.getDashboard();
      // setData(response.data);
      
      // Using placeholder data for now
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
      setData(PLACEHOLDER_DATA);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setData(PLACEHOLDER_DATA); // Fallback to placeholder
    } finally {
      setLoading(false);
    }
  };

  // Use auth user name or placeholder
  const user = authUser || PLACEHOLDER_DATA.user;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Dobro jutro';
    if (hour < 18) return 'Dobar dan';
    return 'Dobro veče';
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <main className="dashboard-modern">
      <SEO 
        title="Kontrolna Tabla"
        description="Upravljajte Instagram marketingom sa jedne kontrolne table."
        url="/dashboard"
        noindex={true}
      />

      {/* Header Section */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!</h1>
          <p>Evo pregleda vašeg Instagram naloga i aktivnosti</p>
        </div>
        <div className="header-actions">
          <Link to="/app/ai-video" className="btn-action btn-secondary-action">
            <FiZap />
            <span>AI Video</span>
          </Link>
          <Link to="/posts/create" className="btn-action btn-primary-action">
            <FiPlus />
            <span>Nova Objava</span>
          </Link>
        </div>
      </header>

      {/* KPI Cards Row */}
      <KpiGrid>
        <KpiCard
          label="UKUPNO OBJAVA"
          value={data?.overview?.posts?.total || 0}
          icon={<FiImage />}
          iconColor="blue"
          subtitle={`${data?.overview?.posts?.published || 0} objavljeno`}
        />
        <KpiCard
          label="UKUPNO REELS"
          value={data?.overview?.reels?.total || 0}
          icon={<FiFilm />}
          iconColor="purple"
          subtitle={`${data?.overview?.reels?.published || 0} objavljeno`}
        />
        <KpiCard
          label="KAMPANJE"
          value={data?.overview?.campaigns?.total || 0}
          icon={<FiTarget />}
          iconColor="pink"
          subtitle={`${data?.overview?.campaigns?.active || 0} aktivnih`}
        />
        <KpiCard
          label="ZAKAZANO"
          value={data?.overview?.posts?.scheduled || 0}
          icon={<FiCalendar />}
          iconColor="orange"
          subtitle="čeka objavljivanje"
        />
        <KpiCard
          label="PRATILACA"
          value={formatNumber(data?.account?.followers)}
          icon={<FiUsers />}
          iconColor="green"
          subtitle="na Instagram-u"
        />
      </KpiGrid>

      {/* Engagement Overview - Full Width */}
      <section className="section-card engagement-section">
        <div className="section-header">
          <div className="section-title">
            <FiTrendingUp className="section-icon" />
            <h2>Pregled Angažovanja</h2>
          </div>
          <Link to="/analytics" className="link-button">
            Pogledaj analitiku <FiExternalLink />
          </Link>
        </div>
        <div className="engagement-grid">
          <div className="engagement-stat">
            <div className="engagement-icon-wrap red">
              <FiHeart />
            </div>
            <div className="engagement-info">
              <span className="engagement-number">{formatNumber(data?.contentMetrics?.likes)}</span>
              <span className="engagement-label">Lajkova</span>
            </div>
          </div>
          <div className="engagement-stat">
            <div className="engagement-icon-wrap blue">
              <FiMessageCircle />
            </div>
            <div className="engagement-info">
              <span className="engagement-number">{formatNumber(data?.contentMetrics?.comments)}</span>
              <span className="engagement-label">Komentara</span>
            </div>
          </div>
          <div className="engagement-stat">
            <div className="engagement-icon-wrap green">
              <FiEye />
            </div>
            <div className="engagement-info">
              <span className="engagement-number">{formatNumber(data?.contentMetrics?.reach)}</span>
              <span className="engagement-label">Domet</span>
            </div>
          </div>
          <div className="engagement-stat">
            <div className="engagement-icon-wrap purple">
              <FiTrendingUp />
            </div>
            <div className="engagement-info">
              <span className="engagement-number">{formatNumber(data?.contentMetrics?.impressions)}</span>
              <span className="engagement-label">Impresija</span>
            </div>
          </div>
        </div>
        {/* Chart placeholder */}
        <div className="chart-placeholder">
          <div className="chart-bars">
            {[65, 45, 75, 55, 85, 60, 70].map((height, i) => (
              <div key={i} className="chart-bar" style={{ height: `${height}%` }}></div>
            ))}
          </div>
          <div className="chart-labels">
            <span>Pon</span><span>Uto</span><span>Sre</span><span>Čet</span><span>Pet</span><span>Sub</span><span>Ned</span>
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="two-column-grid">
        {/* Left: Scheduled Posts */}
        <section className="section-card">
          <div className="section-header">
            <div className="section-title">
              <FiClock className="section-icon" />
              <h2>Zakazane Objave</h2>
            </div>
            <Link to="/schedule" className="link-button">
              Prikaži sve <FiExternalLink />
            </Link>
          </div>
          <div className="scheduled-list">
            {data?.scheduledPosts?.length > 0 ? (
              data.scheduledPosts.slice(0, 5).map((post, index) => (
                <div key={index} className="scheduled-item">
                  <div className="scheduled-icon">
                    {post.type === 'reel' ? <FiFilm /> : <FiImage />}
                  </div>
                  <div className="scheduled-content">
                    <p className="scheduled-caption">
                      {post.caption?.substring(0, 50) || 'Bez opisa'}
                      {post.caption?.length > 50 ? '...' : ''}
                    </p>
                    <span className="scheduled-time">
                      {new Date(post.scheduledFor).toLocaleDateString('sr-RS', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <span className="scheduled-badge">Zakazano</span>
                </div>
              ))
            ) : (
              <div className="empty-state-small">
                <FiCalendar />
                <p>Nema zakazanih objava</p>
                <Link to="/posts/create" className="btn-small">Zakažite prvu</Link>
              </div>
            )}
          </div>
        </section>

        {/* Right: Instagram Account + Quick Actions */}
        <div className="right-column">
          {/* Instagram Account Card */}
          <section className="section-card account-section">
            <div className="section-header">
              <div className="section-title">
                <FaInstagram className="section-icon instagram-icon" />
                <h2>Instagram Nalog</h2>
              </div>
            </div>
            {data?.account?.connected ? (
              <div className="account-connected">
                <div className="account-row">
                  <div className="account-avatar">
                    {data.account.profilePicture ? (
                      <img src={data.account.profilePicture} alt="" />
                    ) : (
                      <span>{data.account.username?.charAt(0).toUpperCase() || 'I'}</span>
                    )}
                  </div>
                  <div className="account-details">
                    <span className="account-username">@{data.account.username}</span>
                    <span className="account-followers">{formatNumber(data.account.followers)} pratilaca</span>
                  </div>
                  <div className="status-badge connected">
                    <FiCheckCircle /> Povezan
                  </div>
                </div>
                <div className="account-actions">
                  <Link to="/settings" className="btn-outline">
                    <FiSettings /> Podešavanja
                  </Link>
                  <a 
                    href={`https://instagram.com/${data.account.username}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-outline"
                  >
                    <FiExternalLink /> Otvori Profil
                  </a>
                </div>
              </div>
            ) : (
              <div className="account-disconnected">
                <div className="disconnected-icon">
                  <FaInstagram />
                </div>
                <p>Povežite vaš Instagram Business nalog</p>
                <Link to="/settings" className="btn-connect">
                  Poveži Instagram
                </Link>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="section-card">
            <div className="section-header">
              <div className="section-title">
                <FiZap className="section-icon" />
                <h2>Brze Akcije</h2>
              </div>
            </div>
            <div className="quick-actions-grid">
              <Link to="/posts/create" className="quick-action-item">
                <FiImage />
                <span>Nova Objava</span>
              </Link>
              <Link to="/reels/create" className="quick-action-item">
                <FiFilm />
                <span>Novi Reel</span>
              </Link>
              <Link to="/app/ai-video" className="quick-action-item">
                <FiZap />
                <span>AI Video</span>
              </Link>
              <Link to="/campaigns/create" className="quick-action-item">
                <FiTarget />
                <span>Kampanja</span>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Recent Campaigns Table */}
      <section className="section-card">
        <div className="section-header">
          <div className="section-title">
            <FiTarget className="section-icon" />
            <h2>Nedavne Kampanje</h2>
          </div>
          <Link to="/campaigns" className="link-button">
            Sve kampanje <FiExternalLink />
          </Link>
        </div>
        <div className="campaigns-table-wrap">
          {data?.recentCampaigns?.length > 0 ? (
            <table className="campaigns-table">
              <thead>
                <tr>
                  <th>Naziv</th>
                  <th>Status</th>
                  <th>Budžet</th>
                  <th>Impresije</th>
                  <th>Klikovi</th>
                  <th>Konverzije</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCampaigns.slice(0, 5).map((campaign, index) => (
                  <tr key={index}>
                    <td className="campaign-name">{campaign.name}</td>
                    <td>
                      <span className={`status-pill ${campaign.status}`}>
                        {campaign.status === 'active' ? 'Aktivna' : 
                         campaign.status === 'paused' ? 'Pauzirana' : 
                         campaign.status === 'completed' ? 'Završena' : campaign.status}
                      </span>
                    </td>
                    <td>${campaign.budget?.toFixed(2) || '0.00'}</td>
                    <td>{formatNumber(campaign.impressions)}</td>
                    <td>{formatNumber(campaign.clicks)}</td>
                    <td>{campaign.conversions || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state-table">
              <FiTarget />
              <p>Još nemate kampanja</p>
              <Link to="/campaigns/create" className="btn-small">Kreirajte prvu kampanju</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
