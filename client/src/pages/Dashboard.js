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
  FiCalendar,
  FiUsers,
  FiTarget,
  FiZap,
  FiBarChart2,
  FiBookmark
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import SEO from '../components/SEO';
import './Dashboard.css';

// ============================================================
// PLACEHOLDER DATA - Replace with your backend API calls
// ============================================================
const PLACEHOLDER_DATA = {
  user: { name: 'Goran' },
  kpis: [
    { id: 'posts', label: 'Objave', value: '128', change: '+12', trend: 'up', icon: 'image' },
    { id: 'followers', label: 'Pratilaca', value: '24.5K', change: '+842', trend: 'up', icon: 'users' },
    { id: 'engagement', label: 'Angažovanje', value: '5.4%', change: '+0.8%', trend: 'up', icon: 'trending' },
    { id: 'reach', label: 'Domet', value: '128K', change: '-2.1K', trend: 'down', icon: 'eye' },
    { id: 'saves', label: 'Sačuvano', value: '2.1K', change: '+156', trend: 'up', icon: 'bookmark' }
  ],
  engagement: {
    likes: 45200,
    comments: 3840,
    shares: 1250,
    saves: 2100
  },
  chartData: [
    { day: 'Pon', value: 65, label: '6.5K' },
    { day: 'Uto', value: 45, label: '4.5K' },
    { day: 'Sre', value: 75, label: '7.5K' },
    { day: 'Čet', value: 55, label: '5.5K' },
    { day: 'Pet', value: 85, label: '8.5K' },
    { day: 'Sub', value: 60, label: '6.0K' },
    { day: 'Ned', value: 70, label: '7.0K' }
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
    { id: 1, type: 'post', caption: 'Exciting new product launch coming soon! 🚀', scheduledFor: '2025-11-29T10:00:00', status: 'scheduled' },
    { id: 2, type: 'reel', caption: 'Behind the scenes of our latest shoot 🎬', scheduledFor: '2025-11-29T14:30:00', status: 'scheduled' },
    { id: 3, type: 'post', caption: 'Customer spotlight: Success story', scheduledFor: '2025-11-30T09:00:00', status: 'scheduled' },
    { id: 4, type: 'post', caption: 'Tips & tricks for better results', scheduledFor: '2025-11-30T16:00:00', status: 'draft' },
    { id: 5, type: 'reel', caption: 'Weekly roundup video', scheduledFor: '2025-12-01T12:00:00', status: 'scheduled' }
  ],
  campaigns: [
    { id: 1, name: 'Black Friday Sale', status: 'active', spent: '$245', impressions: '45.2K', clicks: '1.2K', ctr: '2.7%' },
    { id: 2, name: 'Holiday Collection', status: 'active', spent: '$180', impressions: '32.1K', clicks: '890', ctr: '2.8%' },
    { id: 3, name: 'Brand Awareness', status: 'paused', spent: '$520', impressions: '128K', clicks: '3.4K', ctr: '2.6%' },
    { id: 4, name: 'Product Launch', status: 'completed', spent: '$350', impressions: '67.8K', clicks: '2.1K', ctr: '3.1%' }
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

  const getKpiIcon = (type) => {
    const icons = {
      image: FiImage,
      users: FiUsers,
      trending: FiTrendingUp,
      eye: FiEye,
      bookmark: FiBookmark
    };
    const Icon = icons[type] || FiBarChart2;
    return <Icon />;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <SEO 
        title="Kontrolna Tabla"
        description="Upravljajte Instagram marketingom sa jedne kontrolne table."
        url="/dashboard"
        noindex={true}
      />

      {/* ========== HEADER ========== */}
      <header className="dashboard-header">
        <div className="header-text">
          <h1>{getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!</h1>
          <p>Pregled vašeg Instagram naloga i performansi</p>
        </div>
        <div className="header-actions">
          <Link to="/app/ai-video" className="btn btn-secondary">
            <FiZap /> AI Video
          </Link>
          <Link to="/posts/create" className="btn btn-primary">
            <FiPlus /> Nova Objava
          </Link>
        </div>
      </header>

      {/* ========== KPI ROW ========== */}
      <section className="kpi-section">
        {data?.kpis?.map((kpi) => (
          <div key={kpi.id} className="kpi-card">
            <div className="kpi-icon">{getKpiIcon(kpi.icon)}</div>
            <div className="kpi-content">
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-value">{kpi.value}</span>
              <span className={`kpi-change ${kpi.trend}`}>
                {kpi.trend === 'up' ? '↑' : '↓'} {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ========== MAIN 2-COLUMN LAYOUT ========== */}
      <div className="main-grid">
        {/* LEFT COLUMN: Engagement + Chart */}
        <div className="left-column">
          {/* Engagement Overview Card */}
          <section className="card">
            <div className="card-header">
              <div className="card-title">
                <FiBarChart2 className="card-icon" />
                <h2>Pregled Angažovanja</h2>
              </div>
              <Link to="/analytics" className="card-link">
                Analitika <FiExternalLink />
              </Link>
            </div>
            <div className="engagement-grid">
              <div className="engagement-item">
                <FiHeart className="engagement-icon red" />
                <div>
                  <span className="engagement-value">{formatNumber(data?.engagement?.likes)}</span>
                  <span className="engagement-label">Lajkova</span>
                </div>
              </div>
              <div className="engagement-item">
                <FiMessageCircle className="engagement-icon blue" />
                <div>
                  <span className="engagement-value">{formatNumber(data?.engagement?.comments)}</span>
                  <span className="engagement-label">Komentara</span>
                </div>
              </div>
              <div className="engagement-item">
                <FiTrendingUp className="engagement-icon green" />
                <div>
                  <span className="engagement-value">{formatNumber(data?.engagement?.shares)}</span>
                  <span className="engagement-label">Deljenja</span>
                </div>
              </div>
              <div className="engagement-item">
                <FiBookmark className="engagement-icon purple" />
                <div>
                  <span className="engagement-value">{formatNumber(data?.engagement?.saves)}</span>
                  <span className="engagement-label">Sačuvano</span>
                </div>
              </div>
            </div>
          </section>

          {/* Chart Card (Smaller) */}
          <section className="card card-chart">
            <div className="card-header">
              <div className="card-title">
                <FiTrendingUp className="card-icon" />
                <h2>Nedeljni Pregled</h2>
              </div>
              <span className="chart-period">Poslednjih 7 dana</span>
            </div>
            <div className="chart-wrapper">
              {data?.chartData?.map((item, i) => (
                <div key={i} className="chart-col">
                  <div className="chart-bar-wrap">
                    <span className="chart-val">{item.label}</span>
                    <div className="chart-bar" style={{ height: `${item.value}%` }} />
                  </div>
                  <span className="chart-label">{item.day}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Instagram Account + Scheduled Posts */}
        <div className="right-column">
          {/* Instagram Account Card */}
          <section className="card">
            <div className="card-header">
              <div className="card-title">
                <FaInstagram className="card-icon instagram" />
                <h2>Instagram Nalog</h2>
              </div>
              <span className={`badge ${data?.account?.connected ? 'badge-success' : 'badge-error'}`}>
                <FiCheckCircle /> {data?.account?.connected ? 'Povezan' : 'Nepovezan'}
              </span>
            </div>

            {data?.account?.connected ? (
              <>
                <div className="profile-row">
                  <div className="profile-avatar">
                    {data.account.profilePicture ? (
                      <img src={data.account.profilePicture} alt="" />
                    ) : (
                      <span>{data.account.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="profile-info">
                    <span className="profile-username">@{data.account.username}</span>
                    <div className="profile-stats">
                      <span><strong>{formatNumber(data.account.followers)}</strong> pratilaca</span>
                      <span><strong>{data.account.posts}</strong> objava</span>
                    </div>
                  </div>
                </div>
                <div className="profile-actions">
                  <Link to="/settings" className="btn-icon"><FiSettings /></Link>
                  <a href={`https://instagram.com/${data?.account?.username}`} target="_blank" rel="noopener noreferrer" className="btn-icon"><FiExternalLink /></a>
                </div>
              </>
            ) : (
              <div className="connect-prompt">
                <p>Povežite Instagram Business nalog</p>
                <Link to="/settings" className="btn btn-primary btn-sm">Poveži</Link>
              </div>
            )}
          </section>

          {/* Scheduled Posts List */}
          <section className="card card-posts">
            <div className="card-header">
              <div className="card-title">
                <FiClock className="card-icon" />
                <h2>Zakazane Objave</h2>
              </div>
              <Link to="/schedule" className="card-link">
                Sve <FiExternalLink />
              </Link>
            </div>

            <div className="posts-list">
              {data?.scheduledPosts?.slice(0, 4).map((post) => (
                <div key={post.id} className="post-row">
                  <div className="post-icon">
                    {post.type === 'reel' ? <FiFilm /> : <FiImage />}
                  </div>
                  <div className="post-content">
                    <p className="post-text">{post.caption}</p>
                    <span className="post-time">{formatDate(post.scheduledFor)}</span>
                  </div>
                  <span className={`post-badge ${post.status}`}>
                    {post.status === 'scheduled' ? 'Zakazano' : 'Nacrt'}
                  </span>
                </div>
              ))}
            </div>

            {(!data?.scheduledPosts?.length) && (
              <div className="empty-box">
                <FiCalendar />
                <p>Nema zakazanih objava</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
