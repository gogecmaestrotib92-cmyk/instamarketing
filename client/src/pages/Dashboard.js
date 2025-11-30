import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiCheckCircle,
  FiExternalLink,
  FiSettings
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import SEO from '../components/SEO';
import DashboardHeader from '../components/DashboardHeader';
import '../components/DashboardHeader.css';
import './Dashboard.css';

// ============================================================
// PLACEHOLDER DATA - Replace with your backend API calls
// ============================================================
const PLACEHOLDER_DATA = {
  user: { name: 'Goran' },
  account: {
    connected: false,
    username: 'your_brand',
    followers: 24500,
    following: 892,
    posts: 128,
    profilePicture: null
  }
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

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
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
        title="Dashboard"
        description="Manage your Instagram marketing from a single dashboard."
        url="/dashboard"
        noindex={true}
      />

      {/* ========== HEADER ========== */}
      <DashboardHeader userName={user?.name} />

      {/* ========== INSTAGRAM ACCOUNT CONNECTION ========== */}
      <div className="dashboard-content">
        <section className="card instagram-card">
          <div className="card-header">
            <div className="card-title">
              <FaInstagram className="card-icon instagram" />
              <h2>Instagram Account</h2>
            </div>
            <span className={`badge ${data?.account?.connected ? 'badge-success' : 'badge-error'}`}>
              <FiCheckCircle /> {data?.account?.connected ? 'Connected' : 'Disconnected'}
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
                    <span><strong>{formatNumber(data.account.followers)}</strong> followers</span>
                    <span><strong>{data.account.posts}</strong> posts</span>
                  </div>
                </div>
              </div>
              <div className="profile-actions">
                <Link to="/app/settings" className="btn-icon"><FiSettings /></Link>
                <a href={`https://instagram.com/${data?.account?.username}`} target="_blank" rel="noopener noreferrer" className="btn-icon"><FiExternalLink /></a>
              </div>
            </>
          ) : (
            <div className="connect-prompt">
              <FaInstagram className="connect-icon" />
              <h3>Connect Your Instagram</h3>
              <p>Link your Instagram Business account to start creating and publishing content</p>
              <Link to="/app/settings" className="btn btn-primary">Connect Instagram</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
