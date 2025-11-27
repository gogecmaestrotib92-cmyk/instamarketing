import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const InstagramCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to connect Instagram');
        setStatus('Failed');
        toast.error('Please log in first');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (errorParam) {
        setError(errorDescription || 'Authorization was denied');
        setStatus('Failed');
        toast.error('Instagram connection failed');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setStatus('Failed');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      try {
        setStatus('Connecting to Instagram...');
        
        // Send the code to our backend to exchange for access token
        await api.post('/auth/connect/instagram', { code });
        
        setStatus('Connected successfully!');
        toast.success('Instagram account connected successfully!');
        
        setTimeout(() => navigate('/settings'), 2000);
      } catch (err) {
        console.error('Instagram connection error:', err);
        setError(err.response?.data?.error || 'Failed to connect Instagram account');
        setStatus('Failed');
        toast.error(err.response?.data?.error || 'Failed to connect Instagram account');
        setTimeout(() => navigate('/settings'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <div className="auth-card" style={{ textAlign: 'center', background: '#1a1a1a', padding: '40px', borderRadius: '16px', maxWidth: '420px' }}>
        <h2 style={{ marginBottom: '20px' }}>📷 Instagram Connection</h2>
        
        <div style={{ margin: '30px 0' }}>
          {!error ? (
            <>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #333',
                borderTop: '4px solid #E1306C',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ color: '#fff' }}>{status}</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
              <p style={{ color: '#ff4757' }}>{error}</p>
              <p style={{ color: '#888', marginTop: '10px' }}>Redirecting to settings...</p>
            </>
          )}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default InstagramCallback;
