import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaInstagram } from 'react-icons/fa';
import { FiMail, FiLock, FiUser, FiBriefcase, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.company);
      toast.success('Account created successfully!');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <SEO 
        title="Sign Up - Create Free Account"
        description="Create a free InstaMarketing account. Start automating your Instagram marketing today - schedule posts, run ad campaigns and grow your audience."
        url="/register"
        keywords="register InstaMarketing, create account, instagram automation free, social media marketing platform"
      />
      <section className="auth-card" aria-labelledby="register-heading">
        <header className="auth-header">
          <FaInstagram className="auth-logo" aria-hidden="true" />
          <h1 id="register-heading">InstaMarketing</h1>
          <p>Create your account</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" className="label">Full Name *</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" aria-hidden="true" />
              <input
                id="name"
                type="text"
                name="name"
                className="input"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
                aria-required="true"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="label">Email *</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" aria-hidden="true" />
              <input
                id="email"
                type="email"
                name="email"
                className="input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                aria-required="true"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="company" className="label">Company (Optional)</label>
            <div className="input-wrapper">
              <FiBriefcase className="input-icon" aria-hidden="true" />
              <input
                id="company"
                type="text"
                name="company"
                className="input"
                placeholder="Enter company name"
                value={formData.company}
                onChange={handleChange}
                autoComplete="organization"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">Password *</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="input"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                aria-required="true"
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="confirmPassword" className="label">Confirm Password *</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" aria-hidden="true" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                aria-required="true"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full" 
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <footer className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </footer>
      </section>

      <section className="auth-features" aria-labelledby="features-heading">
        <h2 id="features-heading">Start Growing Your Instagram Today</h2>
        <ul>
          <li><span aria-hidden="true">✨</span> Free plan available</li>
          <li><span aria-hidden="true">📱</span> Unlimited post scheduling</li>
          <li><span aria-hidden="true">🎯</span> Powerful ad management</li>
          <li><span aria-hidden="true">📊</span> Detailed analytics</li>
        </ul>
      </section>
    </main>
  );
};

export default Register;
