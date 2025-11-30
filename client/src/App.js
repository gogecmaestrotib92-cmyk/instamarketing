import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import SEO from './components/SEO';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import CreatePost from './pages/CreatePost';
import Reels from './pages/Reels';
import CreateReel from './pages/CreateReel';
import Campaigns from './pages/Campaigns';
import CreateCampaign from './pages/CreateCampaign';
import Schedule from './pages/Schedule';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import InstagramCallback from './pages/InstagramCallback';
import AIVideo from './pages/AIVideo';
import VideoEdit from './pages/VideoEdit';
import AITools from './pages/AITools';
import AdvancedVideoGenerator from './pages/AdvancedVideoGenerator';

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
        <Route path="posts" element={<Posts />} />
        <Route path="posts/create" element={<CreatePost />} />
        <Route path="posts/edit/:id" element={<CreatePost />} />
        <Route path="reels" element={<Reels />} />
        <Route path="reels/create" element={<CreateReel />} />
        <Route path="reels/edit/:id" element={<CreateReel />} />
        <Route path="ai-video" element={<AIVideo />} />
        <Route path="ai-video/edit" element={<VideoEdit />} />
        <Route path="ai-tools" element={<AITools />} />
        <Route path="advanced-video" element={<AdvancedVideoGenerator />} />
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
      <Route path="/posts/*" element={<Navigate to="/app/posts" />} />
      <Route path="/reels/*" element={<Navigate to="/app/reels" />} />
      <Route path="/campaigns/*" element={<Navigate to="/app/campaigns" />} />
      <Route path="/schedule" element={<Navigate to="/app/schedule" />} />
      <Route path="/scheduler" element={<Navigate to="/app/scheduler" />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" />} />
      <Route path="/settings" element={<Navigate to="/app/settings" />} />
      <Route path="/ai-tools" element={<Navigate to="/app/ai-tools" />} />
      <Route path="/ai-video" element={<Navigate to="/app/ai-video" />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ErrorBoundary>
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
              theme="dark"
            />
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
