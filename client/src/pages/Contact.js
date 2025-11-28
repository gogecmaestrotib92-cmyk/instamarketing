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
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page">
      <SEO 
        title="Contact Us"
        description="Have questions? Contact the InstaMarketing team. We're here to help you automate your Instagram marketing."
        keywords="contact instamarketing, support, help, instagram marketing"
        url="/contact"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Contact', url: '/contact' }
        ]}
      />

      <header className="page-header center">
        <h1>Contact Us</h1>
        <p>We're here to answer all your questions</p>
      </header>

      <div className="contact-container">
        <div className="contact-grid">
          {/* Contact Info */}
          <section className="contact-info" aria-labelledby="info-heading">
            <h2 id="info-heading" className="sr-only">Contact Information</h2>
            
            <div className="info-card">
              <h3>Information</h3>
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
                  <span className="label">Phone</span>
                  <a href="tel:+381111234567">+381 11 123 4567</a>
                </div>
              </div>
              <div className="info-item">
                <div className="icon-box"><FiMapPin aria-hidden="true" /></div>
                <div>
                  <span className="label">Location</span>
                  <address>Knez Mihailova 1, Belgrade, Serbia</address>
                </div>
              </div>
            </div>

            <div className="social-card">
              <h3>Follow Us</h3>
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
            <h2 id="form-heading">Send us a message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help you?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Write your message here..."
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Sending...' : <><FiSend aria-hidden="true" /> Send Message</>}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Contact;
