import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/mobile-utils.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Layout from './components/Layout';
import SEO from './components/SEO';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CreateCampaign from './pages/CreateCampaign';
import Schedule from './pages/Schedule';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import InstagramCallback from './pages/InstagramCallback';
import VideoEdit from './pages/VideoEdit';
import AutoPilotNew from './pages/AutoPilotNew';
import AssetHub from './pages/AssetHub';
import ContentCalendar from './pages/ContentCalendar';
import BusinessCreate from './pages/BusinessCreate';
import EcommerceCreate from './pages/EcommerceCreate';

// SEO Landing Pages
import {
  AIInstagramVideoGenerator,
  InstagramReelsGenerator,
  AIInstagramPostGenerator,
  AICaptionGenerator,
  InstagramContentScheduler,
  Features,
  Templates,
  Pricing
} from './pages/landing';

// Coming Soon placeholder component
const ComingSoon = ({ title, description }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '40px',
    textAlign: 'center'
  }}>
    <div style={{
      width: '80px',
      height: '80px',
      borderRadius: '20px',
      background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
      fontSize: '2rem'
    }}>
      🚀
    </div>
    <h1 style={{
      fontSize: '2rem',
      fontWeight: '700',
      color: 'var(--text-primary)',
      margin: '0 0 12px 0'
    }}>
      {title}
    </h1>
    <p style={{
      fontSize: '1.125rem',
      color: 'var(--text-secondary)',
      margin: '0 0 8px 0',
      maxWidth: '400px'
    }}>
      {description}
    </p>
    <span style={{
      display: 'inline-block',
      padding: '8px 16px',
      background: 'var(--accent-soft)',
      color: 'var(--accent-primary)',
      borderRadius: '20px',
      fontSize: '0.875rem',
      fontWeight: '600',
      marginTop: '16px'
    }}>
      Coming Soon
    </span>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Public Route wrapper (redirects to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* SEO Landing Pages */}
      <Route path="/ai-instagram-video-generator" element={<AIInstagramVideoGenerator />} />
      <Route path="/instagram-reels-generator" element={<InstagramReelsGenerator />} />
      <Route path="/ai-instagram-post-generator" element={<AIInstagramPostGenerator />} />
      <Route path="/ai-caption-generator" element={<AICaptionGenerator />} />
      <Route path="/instagram-content-scheduler" element={<InstagramContentScheduler />} />
      <Route path="/features" element={<Features />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/pricing" element={<Pricing />} />
      
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Instagram OAuth callback */}
      <Route path="/auth/instagram/callback" element={<InstagramCallback />} />

      {/* Protected routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/app/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="video-edit" element={<VideoEdit />} />
        
        {/* Create New */}
        <Route path="create/virtual-actor" element={<ComingSoon title="Virtual Actor" description="UGC for storytelling and ads" />} />
        <Route path="create/virtual-actor-ecomm" element={<ComingSoon title="Virtual Actor E-COMM" description="E-commerce UGC content" />} />
        
        {/* Business - main page with cards */}
        <Route path="create/business" element={<BusinessCreate />} />
        <Route path="create/business/trending" element={<ComingSoon title="Trending" description="Faceless subtitle videos & AI voices" />} />
        <Route path="create/business/video" element={<ComingSoon title="Video" description="Short, impactful promo videos" />} />
        <Route path="create/business/ad-creatives" element={<ComingSoon title="Ad Creatives" description="Ads for your business" />} />
        
        {/* E-Commerce - main page with cards */}
        <Route path="create/ecommerce" element={<EcommerceCreate />} />
        <Route path="create/ecommerce/product-creatives" element={<ComingSoon title="Product Creatives" description="Convert Products to static Ad" />} />
        <Route path="create/ecommerce/product-carousels" element={<ComingSoon title="Product Carousels" description="Convert Products to carousel slides" />} />
        <Route path="create/ecommerce/product-videos" element={<ComingSoon title="Product Videos" description="Short animated product videos" />} />
        <Route path="create/ecommerce/product-photoshoot" element={<ComingSoon title="Product Photo Shoot" description="Product with AI backgrounds" />} />

        <Route path="autopilot" element={<AutoPilotNew />} />
        <Route path="asset-hub" element={<AssetHub />} />
        <Route path="calendar" element={<ContentCalendar />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/create" element={<CreateCampaign />} />
        <Route path="campaigns/edit/:id" element={<CreateCampaign />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="scheduler" element={<Schedule />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Legacy routes - redirect to /app */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" />} />
      <Route path="/campaigns/*" element={<Navigate to="/app/campaigns" />} />
      <Route path="/schedule" element={<Navigate to="/app/schedule" />} />
      <Route path="/scheduler" element={<Navigate to="/app/scheduler" />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" />} />
      <Route path="/settings" element={<Navigate to="/app/settings" />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function AppContent() {
  const { theme } = useTheme();
  
  return (
    <Router>
      <SEO />
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </Router>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
