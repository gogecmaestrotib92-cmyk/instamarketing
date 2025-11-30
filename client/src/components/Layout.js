import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiImage, 
  FiFilm, 
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiZap,
  FiChevronDown,
  FiEdit3
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState({});

  // Auto-expand parent when child is active
  React.useEffect(() => {
    if (location.pathname.startsWith('/app/ai-video')) {
      setExpandedItems(prev => ({ ...prev, 'ai-video': true }));
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleExpand = (key) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = [
    { path: '/app/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/app/posts', icon: FiImage, label: 'Posts' },
    { path: '/app/reels', icon: FiFilm, label: 'Reels' },
    { 
      path: '/app/ai-video', 
      icon: FiZap, 
      label: 'AI Video', 
      badge: 'NEW',
      key: 'ai-video',
      children: [
        { path: '/app/ai-video/edit', icon: FiEdit3, label: 'Edit' }
      ]
    },
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
            <div key={item.path} className="nav-item-wrapper">
              {item.children ? (
                <>
                  <div 
                    className={`nav-item nav-item-parent ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                    onClick={() => toggleExpand(item.key)}
                  >
                    <item.icon className="nav-icon" aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`nav-badge ${item.badge.toLowerCase()}`}>
                        {item.badge}
                      </span>
                    )}
                    <FiChevronDown 
                      className={`nav-expand-icon ${expandedItems[item.key] ? 'expanded' : ''}`} 
                      aria-hidden="true" 
                    />
                  </div>
                  <div className={`nav-children ${expandedItems[item.key] ? 'expanded' : ''}`}>
                    <NavLink
                      to={item.path}
                      end
                      className={({ isActive }) => `nav-item nav-child-item ${isActive ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="nav-icon" aria-hidden="true" />
                      <span>Generate</span>
                    </NavLink>
                    {item.children.map(child => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) => `nav-item nav-child-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <child.icon className="nav-icon" aria-hidden="true" />
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </>
              ) : (
                <NavLink
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
              )}
            </div>
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
