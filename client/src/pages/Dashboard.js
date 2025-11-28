import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiImage, 
  FiFilm, 
  FiTrendingUp,
  FiHeart,
  FiMessageCircle,
  FiEye,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiSettings,
  FiCalendar
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import SEO from '../components/SEO';
import { KpiRow } from '../components/KpiCard';
import '../components/KpiCard.css';
import './Dashboard.css';

// ============================================================
// STATIC PLACEHOLDER DATA - Replace with your backend API calls
// ============================================================
const PLACEHOLDER_DATA = {
  user: {
    name: 'Goran'
  },
  kpis: [
    { label: 'Ukupno Objava', value: '128', change: '+12%', trend: 'up' },
    { label: 'Pratilaca', value: '24.5K', change: '+8.2%', trend: 'up' },
    { label: 'Angažovanje', value: '5.4%', change: '+1.2%', trend: 'up' },
    { label: 'Domet', value: '128K', change: '-3%', trend: 'down' }
  ],
  engagement: {
    likes: 45200,
    comments: 3840,
    shares: 1250,
    saves: 2100
  },
  chartData: [
    { day: 'Pon', value: 65 },
    { day: 'Uto', value: 45 },
    { day: 'Sre', value: 75 },
    { day: 'Čet', value: 55 },
    { day: 'Pet', value: 85 },
    { day: 'Sub', value: 60 },
    { day: 'Ned', value: 70 }
  ],
  account: {
    connected: true,
    username: 'your_brand',
    followers: 24500,
    following: 892,
    posts: 128,
    profilePicture: null
  },
  scheduledPosts: [
    { id: 1, type: 'post', caption: 'Exciting new product launch...', scheduledFor: '2025-11-29T10:00:00', thumbnail: null },
    { id: 2, type: 'reel', caption: 'Behind the scenes 🎬', scheduledFor: '2025-11-29T14:30:00', thumbnail: null },
    { id: 3, type: 'post', caption: 'Customer spotlight', scheduledFor: '2025-11-30T09:00:00', thumbnail: null }
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
      await new Promise(resolve => setTimeout(resolve, 300));
      setData(PLACEHOLDER_DATA);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setData(PLACEHOLDER_DATA);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="dash-loading">
        <div className="dash-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dash">
      <SEO 
        title="Kontrolna Tabla"
        description="Upravljajte Instagram marketingom sa jedne kontrolne table."
        url="/dashboard"
        noindex={true}
      />

      {/* Compact Header */}
      <header className="dash-header">
        <div>
          <h1>{getGreeting()}, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p>Pregled vašeg Instagram naloga</p>
        </div>
        <Link to="/posts/create" className="dash-btn-primary">
          <FiPlus /> Nova Objava
        </Link>
      </header>

      {/* KPI Cards - Clean Premium Style */}
      <KpiRow data={data?.kpis || []} />

      {/* Main 2-Column Layout */}
      <div className="dash-grid">
        {/* Left Column - Engagement + Chart */}
        <div className="dash-left">
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Pregled Angažovanja</h2>
              <Link to="/analytics" className="dash-link">Analitika <FiExternalLink /></Link>
            </div>
            
            <div className="dash-stats">
              <div className="dash-stat">
                <FiHeart className="dash-stat-icon red" />
                <div>
                  <span className="dash-stat-value">{formatNumber(data?.engagement?.likes)}</span>
                  <span className="dash-stat-label">Lajkova</span>
                </div>
              </div>
              <div className="dash-stat">
                <FiMessageCircle className="dash-stat-icon blue" />
                <div>
                  <span className="dash-stat-value">{formatNumber(data?.engagement?.comments)}</span>
                  <span className="dash-stat-label">Komentara</span>
                </div>
              </div>
              <div className="dash-stat">
                <FiTrendingUp className="dash-stat-icon green" />
                <div>
                  <span className="dash-stat-value">{formatNumber(data?.engagement?.shares)}</span>
                  <span className="dash-stat-label">Deljenja</span>
                </div>
              </div>
              <div className="dash-stat">
                <FiCalendar className="dash-stat-icon purple" />
                <div>
                  <span className="dash-stat-value">{formatNumber(data?.engagement?.saves)}</span>
                  <span className="dash-stat-label">Sačuvano</span>
                </div>
              </div>
            </div>

            {/* Compact Chart */}
            <div className="dash-chart">
              <div className="dash-chart-bars">
                {data?.chartData?.map((item, i) => (
                  <div key={i} className="dash-chart-col">
                    <div className="dash-chart-bar" style={{ height: `${item.value}%` }}></div>
                    <span className="dash-chart-label">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Account + Scheduled */}
        <div className="dash-right">
          {/* Instagram Account Card */}
          <div className="dash-card dash-account">
            <div className="dash-card-header">
              <h2><FaInstagram className="ig-icon" /> Instagram</h2>
              <span className="dash-status connected"><FiCheckCircle /> Povezan</span>
            </div>
            
            {data?.account?.connected ? (
              <div className="dash-profile">
                <div className="dash-avatar">
                  {data.account.profilePicture ? (
                    <img src={data.account.profilePicture} alt="" />
                  ) : (
                    <span>{data.account.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="dash-profile-info">
                  <span className="dash-username">@{data.account.username}</span>
                  <div className="dash-profile-stats">
                    <span><strong>{formatNumber(data.account.followers)}</strong> pratilaca</span>
                    <span><strong>{data.account.posts}</strong> objava</span>
                  </div>
                </div>
                <Link to="/settings" className="dash-btn-ghost"><FiSettings /></Link>
              </div>
            ) : (
              <div className="dash-connect">
                <p>Povežite Instagram nalog</p>
                <Link to="/settings" className="dash-btn-primary">Poveži</Link>
              </div>
            )}
          </div>

          {/* Scheduled Posts Preview */}
          <div className="dash-card dash-scheduled">
            <div className="dash-card-header">
              <h2><FiClock /> Zakazano</h2>
              <Link to="/schedule" className="dash-link">Sve <FiExternalLink /></Link>
            </div>
            
            <div className="dash-posts-list">
              {data?.scheduledPosts?.slice(0, 3).map((post) => (
                <div key={post.id} className="dash-post-item">
                  <div className="dash-post-thumb">
                    {post.type === 'reel' ? <FiFilm /> : <FiImage />}
                  </div>
                  <div className="dash-post-info">
                    <p>{post.caption}</p>
                    <span>
                      {new Date(post.scheduledFor).toLocaleDateString('sr-RS', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {(!data?.scheduledPosts || data.scheduledPosts.length === 0) && (
              <div className="dash-empty">
                <FiCalendar />
                <p>Nema zakazanih objava</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
