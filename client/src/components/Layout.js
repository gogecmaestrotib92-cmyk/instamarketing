import React, { useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FiHome, 
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronDown,
  FiCpu,
  FiSun,
  FiMoon,
  FiFolder,
  FiCalendar,
  FiPlusCircle,
  FiUser,
  FiShoppingBag,
  FiBriefcase,
  FiDatabase
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState({}); // Start collapsed
  
  // Refs for focus management
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle escape key to close sidebar
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape' && sidebarOpen) {
      setSidebarOpen(false);
      menuButtonRef.current?.focus();
    }
  }, [sidebarOpen]);

  // Focus trap for accessibility
  const handleTabKey = useCallback((e) => {
    if (!sidebarOpen) return;
    
    const focusableElements = sidebarRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [sidebarOpen]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      // Add class to body for additional CSS control
      document.body.classList.add('sidebar-open');
      document.body.style.overflow = 'hidden';
      // Prevent content shift by storing scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      // Focus the close button when opening
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.classList.remove('sidebar-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      document.body.classList.remove('sidebar-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Add keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('keydown', handleTabKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [handleEscapeKey, handleTabKey]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleExpand = (key) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    menuButtonRef.current?.focus();
  };

  const navItems = [
    { path: '/app/dashboard', icon: FiHome, label: 'Dashboard' },
    { 
      path: '/app/create', 
      icon: FiPlusCircle, 
      label: 'Create New',
      key: 'create-new',
      emphasized: 'primary',
      children: [
        // Virtual Actor
        { path: '/app/create/virtual-actor', icon: FiUser, label: 'Virtual Actor', description: 'UGC for storytelling and ads' },
        { path: '/app/create/virtual-actor-ecomm', icon: FiShoppingBag, label: 'Virtual Actor E-COMM', description: 'E-commerce UGC content' },
        // Business - single page with cards
        { path: '/app/create/business', icon: FiBriefcase, label: 'Business', description: 'Trending, Video, Ad Creatives' },
        // E-Commerce - single page with cards
        { path: '/app/create/ecommerce', icon: FiShoppingBag, label: 'E-Commerce', description: 'Product creatives, videos & more' }
      ]
    },
    { path: '/app/autopilot', icon: FiCpu, label: 'AI Auto-Pilot', badge: 'NEW', emphasized: 'secondary' },
    { path: '/app/asset-hub', icon: FiFolder, label: 'Asset Hub' },
    { path: '/app/business-hub', icon: FiDatabase, label: 'Business Hub', badge: 'NEW' },
    { path: '/app/calendar', icon: FiCalendar, label: 'Content Calendar' },
    { path: '/app/settings', icon: FiSettings, label: 'Settings' }
  ];
  
  // Video Edit page is still accessible at /app/video-edit (hidden from menu)

  return (
    <div className="layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button 
          ref={menuButtonRef}
          className="menu-toggle" 
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-nav"
        >
          <FiMenu aria-hidden="true" />
          <span className="sr-only">{sidebarOpen ? 'Close' : 'Open'} navigation menu</span>
        </button>
        <div className="mobile-logo">
          <FaInstagram className="logo-icon" aria-hidden="true" />
          <span>AIInstaMarketing</span>
        </div>
      </header>

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar / Drawer */}
      <aside 
        ref={sidebarRef}
        id="sidebar-nav"
        className={`sidebar ${sidebarOpen ? 'open' : ''}`} 
        aria-label="Main navigation"
        aria-hidden={!sidebarOpen}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile close button */}
        <div className="sidebar-mobile-header">
          <div className="sidebar-header-content">
            <FaInstagram className="logo-icon" aria-hidden="true" />
            <span className="logo-text">AIInstaMarketing</span>
          </div>
          <button 
            ref={closeButtonRef}
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        {/* Desktop logo (hidden on mobile) */}
        <div className="sidebar-header desktop-only">
          <FaInstagram className="logo-icon" aria-hidden="true" />
          <span className="logo-text">AIInstaMarketing</span>
        </div>

        <nav className="sidebar-nav" role="navigation">
          {navItems.map((item, index) => (
            <div key={item.path} className={`nav-item-wrapper ${item.emphasized ? `emphasized-${item.emphasized}` : ''}`}>
              {item.children ? (
                <>
                  <button 
                    type="button"
                    className={`nav-item nav-item-parent ${location.pathname.startsWith(item.path) ? 'active' : ''} ${item.emphasized ? `nav-emphasized-${item.emphasized}` : ''}`}
                    onClick={() => toggleExpand(item.key)}
                    aria-expanded={expandedItems[item.key]}
                    aria-controls={`nav-children-${item.key}`}
                    ref={index === 0 ? firstFocusableRef : null}
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
                  </button>
                  <div 
                    id={`nav-children-${item.key}`}
                    className={`nav-children ${expandedItems[item.key] ? 'expanded' : ''}`}
                    role="group"
                    aria-label={`${item.label} submenu`}
                  >
                    <div className="nav-children-inner">
                      {item.children.map((child, childIndex) => (
                        child.type === 'divider' ? (
                          <div key={`divider-${childIndex}`} className="nav-divider">
                            <span>{child.label}</span>
                          </div>
                        ) : (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) => `nav-item nav-child-item ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                          >
                            <child.icon className="nav-icon" aria-hidden="true" />
                            <span>{child.label}</span>
                          </NavLink>
                        )
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.emphasized ? `nav-emphasized-${item.emphasized}` : ''}`}
                  onClick={closeSidebar}
                  ref={index === 0 ? firstFocusableRef : null}
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
          {/* Theme Toggle */}
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            <span className={`theme-toggle-icon ${isDark ? 'active' : ''}`}>
              <FiMoon aria-hidden="true" />
            </span>
            <span className={`theme-toggle-icon ${!isDark ? 'active' : ''}`}>
              <FiSun aria-hidden="true" />
            </span>
            <span className="theme-toggle-slider" />
          </button>
          
          <div className="user-info">
            <div className="user-avatar" aria-hidden="true">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-plan">{user?.plan || 'Free'} Plan</span>
            </div>
          </div>
          <button 
            ref={lastFocusableRef}
            className="logout-btn" 
            onClick={handleLogout} 
            aria-label="Log out"
          >
            <FiLogOut aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" id="main-content" tabIndex="-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
