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
    { path: '/app/dashboard', icon: FiHome, label: 'Kontrolna Tabla' },
    { path: '/app/posts', icon: FiImage, label: 'Objave' },
    { path: '/app/reels', icon: FiFilm, label: 'Rilsovi' },
    { path: '/app/ai-video', icon: FiZap, label: 'AI Video', badge: 'NOVO' },
    { path: '/app/ai-tools', icon: FiCpu, label: 'AI Alati', badge: 'NOVO' },
    { path: '/app/advanced-video', icon: FiVideo, label: 'Napredni Video', badge: 'PRO' },
    { path: '/app/campaigns', icon: FiTarget, label: 'Kampanje' },
    { path: '/app/schedule', icon: FiCalendar, label: 'Zakazivanje' },
    { path: '/app/analytics', icon: FiBarChart2, label: 'Analitika' },
    { path: '/app/settings', icon: FiSettings, label: 'Podešavanja' }
  ];

  return (
    <div className="layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button 
          className="menu-toggle" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Zatvori meni" : "Otvori meni"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>
        <div className="mobile-logo">
          <FaInstagram className="logo-icon" aria-hidden="true" />
          <span>InstaMarketing</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Bočna traka">
        <div className="sidebar-header">
          <FaInstagram className="logo-icon" aria-hidden="true" />
          <span className="logo-text">InstaMarketing</span>
        </div>

        <nav className="sidebar-nav" aria-label="Glavna navigacija">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="nav-icon" aria-hidden="true" />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
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
          <button className="logout-btn" onClick={handleLogout} aria-label="Odjavi se">
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
