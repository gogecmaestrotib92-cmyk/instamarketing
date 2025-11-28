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
      toast.success('Nalog uspešno kreiran!');
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
        title="Registracija - Kreirajte Besplatan Nalog"
        description="Kreirajte besplatan InstaMarketing nalog. Započnite automatizaciju vašeg Instagram marketinga već danas - zakazujte objave, vodite reklamne kampanje i povećajte publiku."
        url="/register"
        keywords="registracija InstaMarketing, kreiranje naloga, instagram automatizacija besplatno, social media marketing srbija"
      />
      <section className="auth-card" aria-labelledby="register-heading">
        <header className="auth-header">
          <FaInstagram className="auth-logo" aria-hidden="true" />
          <h1 id="register-heading">InstaMarketing</h1>
          <p>Kreirajte vaš nalog</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" className="label">Ime i Prezime *</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" aria-hidden="true" />
              <input
                id="name"
                type="text"
                name="name"
                className="input"
                placeholder="Unesite vaše ime"
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
                placeholder="Unesite vaš email"
                value={formData.email}
                onChange={handleChange}
                required
                aria-required="true"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="company" className="label">Kompanija (Opciono)</label>
            <div className="input-wrapper">
              <FiBriefcase className="input-icon" aria-hidden="true" />
              <input
                id="company"
                type="text"
                name="company"
                className="input"
                placeholder="Unesite ime kompanije"
                value={formData.company}
                onChange={handleChange}
                autoComplete="organization"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">Lozinka *</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="input"
                placeholder="Kreirajte lozinku"
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
                aria-label={showPassword ? "Sakrij lozinku" : "Prikaži lozinku"}
              >
                {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="label">Potvrdite Lozinku *</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" aria-hidden="true" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="input"
                placeholder="Potvrdite vašu lozinku"
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
            {loading ? 'Kreiranje naloga...' : 'Kreiraj Nalog'}
          </button>
        </form>

        <footer className="auth-footer">
          <p>Već imate nalog? <Link to="/login">Prijavite se</Link></p>
        </footer>
      </section>

      <section className="auth-features" aria-labelledby="features-heading">
        <h2 id="features-heading">Počnite Sa Rastom Vašeg Instagram-a Danas</h2>
        <ul>
          <li><span aria-hidden="true">✨</span> Besplatan plan dostupan</li>
          <li><span aria-hidden="true">📱</span> Neograničeno zakazivanje objava</li>
          <li><span aria-hidden="true">🎯</span> Moćno upravljanje reklamama</li>
          <li><span aria-hidden="true">📊</span> Detaljna analitika</li>
        </ul>
      </section>
    </main>
  );
};

export default Register;
