import React, { useState } from 'react';
import { FiMail, FiMapPin, FiPhone, FiSend, FiInstagram, FiTwitter, FiLinkedin, FiFacebook } from 'react-icons/fi';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Poruka uspešno poslata! Javićemo vam se uskoro.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Došlo je do greške. Molimo pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page">
      <SEO 
        title="Kontaktirajte Nas"
        description="Imate pitanja? Kontaktirajte InstaMarketing tim. Tu smo da vam pomognemo oko automatizacije vašeg Instagram marketinga."
        keywords="kontakt instamarketing, podrska, pomoc, instagram marketing srbija"
        url="/contact"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'Kontakt', url: '/contact' }
        ]}
      />

      <header className="page-header center">
        <h1>Kontaktirajte Nas</h1>
        <p>Tu smo da odgovorimo na sva vaša pitanja</p>
      </header>

      <div className="contact-container">
        <div className="contact-grid">
          {/* Contact Info */}
          <section className="contact-info" aria-labelledby="info-heading">
            <h2 id="info-heading" className="sr-only">Kontakt Informacije</h2>
            
            <div className="info-card">
              <h3>Informacije</h3>
              <div className="info-item">
                <div className="icon-box"><FiMail aria-hidden="true" /></div>
                <div>
                  <span className="label">Email</span>
                  <a href="mailto:info@instamarketing.rs">info@instamarketing.rs</a>
                </div>
              </div>
              <div className="info-item">
                <div className="icon-box"><FiPhone aria-hidden="true" /></div>
                <div>
                  <span className="label">Telefon</span>
                  <a href="tel:+381111234567">+381 11 123 4567</a>
                </div>
              </div>
              <div className="info-item">
                <div className="icon-box"><FiMapPin aria-hidden="true" /></div>
                <div>
                  <span className="label">Lokacija</span>
                  <address>Knez Mihailova 1, Beograd, Srbija</address>
                </div>
              </div>
            </div>

            <div className="social-card">
              <h3>Pratite Nas</h3>
              <div className="social-links">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <FiInstagram aria-hidden="true" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <FiTwitter aria-hidden="true" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <FiLinkedin aria-hidden="true" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <FiFacebook aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="contact-form-section" aria-labelledby="form-heading">
            <h2 id="form-heading">Pošaljite nam poruku</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Ime i Prezime</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Vaše ime"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Adresa</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="vas@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Naslov</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Kako vam možemo pomoći?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Poruka</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Napišite vašu poruku ovde..."
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Slanje...' : <><FiSend aria-hidden="true" /> Pošalji Poruku</>}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Contact;
