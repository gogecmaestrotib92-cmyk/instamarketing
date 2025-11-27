import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#0f0f0f',
          color: '#fff',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.1), rgba(247, 119, 55, 0.1))',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '500px',
            border: '1px solid #333'
          }}>
            <FiAlertTriangle style={{
              fontSize: '64px',
              color: '#E1306C',
              marginBottom: '20px'
            }} />
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #E1306C, #F77737)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Ups! Nešto je pošlo naopako
            </h1>
            <p style={{
              color: '#a0a0a0',
              fontSize: '1rem',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Došlo je do greške prilikom učitavanja stranice. 
              Molimo pokušajte ponovo ili se vratite na početnu stranicu.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #E1306C, #C13584)',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 15px rgba(225, 48, 108, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(225, 48, 108, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(225, 48, 108, 0.3)';
                }}
              >
                <FiRefreshCw /> Pokušaj Ponovo
              </button>
              
              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid #333',
                  background: 'transparent',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#1a1a1a';
                  e.target.style.borderColor = '#E1306C';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = '#333';
                }}
              >
                <FiHome /> Početna
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '24px',
                textAlign: 'left',
                background: '#1a1a1a',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.85rem'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  color: '#E1306C',
                  marginBottom: '8px'
                }}>
                  Detalji greške
                </summary>
                <pre style={{
                  overflow: 'auto',
                  color: '#ef4444',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
