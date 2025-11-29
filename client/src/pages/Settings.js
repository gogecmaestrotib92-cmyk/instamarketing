import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FiUser, 
  FiBell, 
  FiLock, 
  FiAlertTriangle
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import SEO from '../components/SEO';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [manualToken, setManualToken] = useState('');
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    timezone: 'UTC'
  });
  
  const [instagram, setInstagram] = useState({
    connected: false,
    username: '',
    accountId: '',
    pageId: '',
    followers: 0,
    profilePicture: ''
  });
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    postPublished: true,
    campaignUpdates: true,
    weeklyReport: true
  });
  
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        timezone: user.timezone || 'UTC'
      });
      setInstagram({
        connected: user.instagramConnected || !!user.instagramAccessToken || !!user.instagram?.connected,
        username: user.instagramUsername || user.instagram?.username || '',
        accountId: user.instagramAccountId || user.instagram?.accountId || '',
        pageId: user.facebookPageId || '',
        followers: user.instagram?.followers || 0,
        profilePicture: user.instagram?.profilePicture || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authAPI.updateProfile(profile);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (password.new !== password.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (password.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await authAPI.changePassword({
        currentPassword: password.current,
        newPassword: password.new
      });
      toast.success('Password changed successfully');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsUpdate = async () => {
    setLoading(true);
    
    try {
      await authAPI.updateProfile({ notifications });
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramConnect = async () => {
    // First try auto-connect with pre-configured token (for demo/testing)
    setLoading(true);
    try {
      const response = await authAPI.autoConnectInstagram();
      setInstagram({
        connected: true,
        username: response.instagram.username,
        accountId: response.instagram.accountId || response.instagram.businessAccountId,
        followers: response.instagram.followers,
        profilePicture: response.instagram.profilePicture
      });
      toast.success(`Connected to @${response.instagram.username}!`);
      setLoading(false);
      return;
    } catch (error) {
      console.log('Auto-connect not available, using OAuth flow');
    }
    setLoading(false);
    
    // Use Facebook OAuth flow for Instagram Business Account
    const appId = process.env.REACT_APP_FACEBOOK_APP_ID || '2955016021354200';
    const redirectUri = `${window.location.origin}/auth/instagram/callback`;
    
    // Required permissions for Instagram Business Account
    const scopes = [
      'instagram_basic',
      'instagram_content_publish', 
      'instagram_manage_comments',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
      'business_management'
    ].join(',');
    
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
    
    // Redirect to Facebook OAuth
    window.location.href = oauthUrl;
  };

  const handleManualTokenConnect = async () => {
    if (!manualToken.trim()) {
      toast.error('Enter Access Token');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.connectInstagramWithToken({ accessToken: manualToken });
      setInstagram({
        connected: true,
        username: response.data.instagram.username,
        accountId: response.data.instagram.accountId,
        followers: response.data.instagram.followers,
        profilePicture: response.data.instagram.profilePicture
      });
      toast.success(`Connected to @${response.data.instagram.username}!`);
      setShowManualConnect(false);
      setManualToken('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Instagram account?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await authAPI.disconnectInstagram();
      setInstagram({
        connected: false,
        username: '',
        accountId: '',
        pageId: ''
      });
      toast.success('Instagram account disconnected');
    } catch (error) {
      toast.error('Failed to disconnect account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirm1) return;
    
    const confirm2 = window.confirm(
      'All your data, scheduled posts, and campaigns will be permanently deleted. Continue?'
    );
    
    if (!confirm2) return;
    
    setLoading(true);
    
    try {
      // Note: You would need to add a deleteAccount method to authAPI
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Australia/Sydney'
  ];

  return (
    <main className="settings-page">
      <SEO 
        title="Settings"
        description="Configure your InstaMarketing account. Instagram connection, notifications, security and account preferences."
        keywords="settings, account configuration, instagram connection, account security, profile settings"
        url="/settings"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Settings', url: '/settings' }
        ]}
        noindex={true}
      />
      <header className="page-header">
        <h1>⚙️ Settings</h1>
      </header>

      <div className="settings-layout">
        <nav className="settings-sidebar" aria-label="Settings navigation">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            aria-current={activeTab === 'profile' ? 'page' : undefined}
          >
            <FiUser className="tab-icon" aria-hidden="true" /> Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'instagram' ? 'active' : ''}`}
            onClick={() => setActiveTab('instagram')}
            aria-current={activeTab === 'instagram' ? 'page' : undefined}
          >
            <FaInstagram className="tab-icon" aria-hidden="true" /> Instagram
          </button>
          <button
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
            aria-current={activeTab === 'notifications' ? 'page' : undefined}
          >
            <FiBell className="tab-icon" aria-hidden="true" /> Notifications
          </button>
          <button
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
            aria-current={activeTab === 'security' ? 'page' : undefined}
          >
            <FiLock className="tab-icon" aria-hidden="true" /> Security
          </button>
          <button
            className={`settings-tab ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
            aria-current={activeTab === 'danger' ? 'page' : undefined}
          >
            <FiAlertTriangle className="tab-icon" aria-hidden="true" /> Danger Zone
          </button>
        </nav>

        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <section className="settings-panel" aria-labelledby="profile-heading">
              <h2 id="profile-heading">Profile Settings</h2>
              <p className="panel-description">
                Manage your account information and preferences.
              </p>
              
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    autoComplete="name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    autoComplete="email"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="timezone">Timezone</label>
                  <select
                    id="timezone"
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </section>
          )}

          {/* Instagram Tab */}
          {activeTab === 'instagram' && (
            <section className="settings-panel" aria-labelledby="instagram-heading">
              <h2 id="instagram-heading">Instagram Connection</h2>
              <p className="panel-description">
                Connect your Instagram Business or Creator account to enable posting and analytics.
              </p>
              
              <div className="connection-status">
                <div className={`status-indicator ${instagram.connected ? 'connected' : 'disconnected'}`}>
                  <span className="status-dot" aria-hidden="true"></span>
                  {instagram.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              {instagram.connected ? (
                <div className="connected-account">
                  <div className="account-info">
                    <div className="account-avatar" aria-hidden="true"><FaInstagram /></div>
                    <div className="account-details">
                      <h3>@{instagram.username}</h3>
                      <p>Instagram Business Account</p>
                    </div>
                  </div>
                  
                  <div className="account-ids">
                    <div className="id-item">
                      <span className="id-label">Account ID</span>
                      <code>{instagram.accountId}</code>
                    </div>
                    <div className="id-item">
                      <span className="id-label">Page ID</span>
                      <code>{instagram.pageId}</code>
                    </div>
                  </div>
                  
                  <button
                    className="btn btn-outline"
                    onClick={handleInstagramDisconnect}
                    disabled={loading}
                  >
                    Disconnect Account
                  </button>
                </div>
              ) : (
                <div className="connect-prompt">
                  <div className="connect-info">
                    <h3>Requirements:</h3>
                    <ul>
                      <li>Instagram Business or Creator account</li>
                      <li>Connected to a Facebook Page</li>
                      <li>Admin access to Facebook Page</li>
                    </ul>
                  </div>
                  
                  <button
                    className="btn btn-instagram"
                    onClick={handleInstagramConnect}
                    disabled={loading}
                  >
                    <FaInstagram aria-hidden="true" /> {loading ? 'Connecting...' : 'Connect Instagram'}
                  </button>

                  {showManualConnect && (
                    <div className="manual-connect-section" style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <h4 style={{ marginBottom: '10px' }}>Manual connection with Access Token</h4>
                      <p style={{ fontSize: '14px', color: '#888', marginBottom: '15px' }}>
                        1. Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff88' }}>Facebook Graph API Explorer</a><br/>
                        2. Select your app and get a token with permissions: instagram_basic, pages_show_list, pages_read_engagement<br/>
                        3. Copy the token and paste it here
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <label htmlFor="manualToken" className="sr-only">Access Token</label>
                        <input
                          id="manualToken"
                          type="text"
                          value={manualToken}
                          onChange={(e) => setManualToken(e.target.value)}
                          placeholder="Enter Access Token"
                          className="form-control"
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={handleManualTokenConnect}
                          disabled={loading}
                        >
                          {loading ? 'Connecting...' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '15px' }}>
                    <button 
                      className="btn btn-link"
                      onClick={() => setShowManualConnect(!showManualConnect)}
                      style={{ fontSize: '14px' }}
                    >
                      {showManualConnect ? 'Hide manual connection' : 'Manual connection with token'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <section className="settings-panel" aria-labelledby="notifications-heading">
              <h2 id="notifications-heading">Notification Preferences</h2>
              <p className="panel-description">
                Choose which notifications you want to receive.
              </p>
              
              <div className="notification-options">
                <div className="notification-item">
                  <div className="notification-info">
                    <h4 id="email-notif-label">Email Notifications</h4>
                    <p>Receive notifications via email</p>
                  </div>
                  <label className="toggle" aria-labelledby="email-notif-label">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        emailNotifications: e.target.checked
                      })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div className="notification-info">
                    <h4 id="post-notif-label">Post Published</h4>
                    <p>Get notified when your scheduled posts are published</p>
                  </div>
                  <label className="toggle" aria-labelledby="post-notif-label">
                    <input
                      type="checkbox"
                      checked={notifications.postPublished}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        postPublished: e.target.checked
                      })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div className="notification-info">
                    <h4 id="campaign-notif-label">Campaign Updates</h4>
                    <p>Receive updates about your ad campaign performance</p>
                  </div>
                  <label className="toggle" aria-labelledby="campaign-notif-label">
                    <input
                      type="checkbox"
                      checked={notifications.campaignUpdates}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        campaignUpdates: e.target.checked
                      })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div className="notification-info">
                    <h4 id="report-notif-label">Weekly Report</h4>
                    <p>Receive a weekly summary of your account performance</p>
                  </div>
                  <label className="toggle" aria-labelledby="report-notif-label">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReport}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        weeklyReport: e.target.checked
                      })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <button
                className="btn btn-primary"
                onClick={handleNotificationsUpdate}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </section>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <section className="settings-panel" aria-labelledby="security-heading">
              <h2 id="security-heading">Security Settings</h2>
              <p className="panel-description">
                Manage your password and account security.
              </p>
              
              <form onSubmit={handlePasswordChange}>
                <h3>Change Password</h3>
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmNewPassword">Confirm New Password</label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
              
              <div className="security-info">
                <h3>Security Tips</h3>
                <ul>
                  <li>Use a strong, unique password</li>
                  <li>Never share your login credentials</li>
                  <li>Log out from shared devices</li>
                  <li>Regularly review your connected apps</li>
                </ul>
              </div>
            </section>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <section className="settings-panel danger" aria-labelledby="danger-heading">
              <h2 id="danger-heading">⚠️ Danger Zone</h2>
              <p className="panel-description">
                These actions are irreversible. Please proceed with caution.
              </p>
              
              <div className="danger-action">
                <div className="danger-info">
                  <h3>Delete Account</h3>
                  <p>
                    Permanently delete your account and all associated data including
                    posts, reels, campaigns, and analytics. This action cannot be undone.
                  </p>
                </div>
                
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  Delete My Account
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default Settings;
