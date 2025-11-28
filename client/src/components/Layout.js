import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiImage, 
  FiFilm, 
  FiTarget, 
  FiCalendar, 
  FiBarChart2, 
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiZap,
  FiCpu,
  FiVideo
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/app/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/app/posts', icon: FiImage, label: 'Posts' },
    { path: '/app/reels', icon: FiFilm, label: 'Reels' },
    { path: '/app/ai-video', icon: FiZap, label: 'AI Video', badge: 'NEW' },
    { path: '/app/ai-tools', icon: FiCpu, label: 'AI Tools', badge: 'NEW' },
    { path: '/app/advanced-video', icon: FiVideo, label: 'Advanced Video', badge: 'PRO' },
    { path: '/app/campaigns', icon: FiTarget, label: 'Campaigns' },
    { path: '/app/schedule', icon: FiCalendar, label: 'Schedule' },
    { path: '/app/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/app/settings', icon: FiSettings, label: 'Settings' }
  ];

  return (
    <div className="layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button 
          className="menu-toggle" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>
        <div className="mobile-logo">
          <FaInstagram className="logo-icon" aria-hidden="true" />
          <span>AIInstaMarketing</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Sidebar">
        <div className="sidebar-header">
          <FaInstagram className="logo-icon" aria-hidden="true" />
          <span className="logo-text">AIInstaMarketing</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="nav-icon" aria-hidden="true" />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`nav-badge ${item.badge.toLowerCase()}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" aria-hidden="true">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-plan">{user?.plan || 'Free'} Plan</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} aria-label="Log out">
            <FiLogOut aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)} 
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <main className="main-content" id="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
