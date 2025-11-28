import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaInstagram } from 'react-icons/fa';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <SEO 
        title="Login"
        description="Sign in to InstaMarketing platform and automate your Instagram marketing. Schedule posts, run ad campaigns and grow your audience."
        keywords="login, sign in, instamarketing login, instagram marketing login"
        url="/login"
      />
      <section className="auth-card" aria-labelledby="login-heading">
        <header className="auth-header">
          <FaInstagram className="auth-logo" aria-hidden="true" />
          <h1 id="login-heading">InstaMarketing</h1>
          <p>Sign in to your account</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="label">Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" aria-hidden="true" />
              <input
                id="email"
                type="email"
                className="input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full" 
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <footer className="auth-footer">
          <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
        </footer>
      </section>

      <section className="auth-features" aria-labelledby="features-heading">
        <h2 id="features-heading">Automate Your Instagram Marketing</h2>
        <ul>
          <li><span aria-hidden="true">📱</span> Schedule posts and reels</li>
          <li><span aria-hidden="true">🎯</span> Create and manage ad campaigns</li>
          <li><span aria-hidden="true">📊</span> Track performance analytics</li>
          <li><span aria-hidden="true">🚀</span> Automatically grow your audience</li>
        </ul>
      </section>
    </main>
  );
};

export default Login;
