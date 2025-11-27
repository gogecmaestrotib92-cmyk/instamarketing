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
      toast.success('Dobrodošli nazad!');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <SEO 
        title="Prijava"
        description="Prijavite se na InstaMarketing platformu i automatizujte vaš Instagram marketing. Zakazujte objave, vodite reklamne kampanje i povećajte vašu publiku."
        keywords="prijava, login, instamarketing prijava, instagram marketing login"
        url="/login"
      />
      <div className="auth-card">
        <div className="auth-header">
          <FaInstagram className="auth-logo" />
          <h1>InstaMarketing</h1>
          <p>Prijavite se na vaš nalog</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="label">Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                className="input"
                placeholder="Unesite vaš email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Lozinka</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Unesite vašu lozinku"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Prijavljivanje...' : 'Prijavi se'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Nemate nalog? <Link to="/register">Registrujte se</Link></p>
        </div>
      </div>

      <div className="auth-features">
        <h2>Automatizujte Vaš Instagram Marketing</h2>
        <ul>
          <li>📱 Zakazujte objave i rilsove</li>
          <li>🎯 Kreirajte i upravljajte reklamnim kampanjama</li>
          <li>📊 Pratite analitiku performansi</li>
          <li>🚀 Automatski povećavajte publiku</li>
        </ul>
      </div>
    </div>
  );
};

export default Login;
