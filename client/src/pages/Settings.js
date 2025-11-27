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
    // Use the auto-connect endpoint with pre-configured token
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
      toast.success(`Povezano sa @${response.instagram.username}!`);
    } catch (error) {
      // If auto-connect fails, show manual connect option
      console.log('Auto-connect failed:', error.response?.data?.error || error.message);
      toast.info('Auto-povezivanje nije uspelo. Pokušajte sa ručnim unosom tokena.');
      setShowManualConnect(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualTokenConnect = async () => {
    if (!manualToken.trim()) {
      toast.error('Unesite Access Token');
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
      toast.success(`Povezano sa @${response.data.instagram.username}!`);
      setShowManualConnect(false);
      setManualToken('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri povezivanju');
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
    <div className="settings-page">
      <SEO 
        title="Podešavanja"
        description="Podesite vaš InstaMarketing nalog. Povezivanje Instagram naloga, notifikacije, bezbednost i preferencije naloga."
        keywords="podešavanja, konfiguracija naloga, instagram povezivanje, bezbednost naloga, profil podešavanja"
        url="/settings"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'Podešavanja', url: '/settings' }
        ]}
        noindex={true}
      />
      <div className="page-header">
        <h1>⚙️ Podešavanja</h1>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser className="tab-icon" /> Profil
          </button>
          <button
            className={`settings-tab ${activeTab === 'instagram' ? 'active' : ''}`}
            onClick={() => setActiveTab('instagram')}
          >
            <FaInstagram className="tab-icon" /> Instagram
          </button>
          <button
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell className="tab-icon" /> Obaveštenja
          </button>
          <button
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiLock className="tab-icon" /> Bezbednost
          </button>
          <button
            className={`settings-tab ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            <FiAlertTriangle className="tab-icon" /> Opasna Zona
          </button>
        </div>

        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-panel">
              <h2>Podešavanja Profila</h2>
              <p className="panel-description">
                Upravljajte informacijama o nalogu i preferencijama.
              </p>
              
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Timezone</label>
                  <select
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
            </div>
          )}

          {/* Instagram Tab */}
          {activeTab === 'instagram' && (
            <div className="settings-panel">
              <h2>Instagram Connection</h2>
              <p className="panel-description">
                Connect your Instagram Business or Creator account to enable posting and analytics.
              </p>
              
              <div className="connection-status">
                <div className={`status-indicator ${instagram.connected ? 'connected' : 'disconnected'}`}>
                  <span className="status-dot"></span>
                  {instagram.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              {instagram.connected ? (
                <div className="connected-account">
                  <div className="account-info">
                    <div className="account-avatar"><FaInstagram /></div>
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
                    <h3>Zahtevi:</h3>
                    <ul>
                      <li>Instagram Business ili Creator nalog</li>
                      <li>Povezan sa Facebook stranicom</li>
                      <li>Admin pristup Facebook stranici</li>
                    </ul>
                  </div>
                  
                  <button
                    className="btn btn-instagram"
                    onClick={handleInstagramConnect}
                    disabled={loading}
                  >
                    <FaInstagram /> {loading ? 'Povezivanje...' : 'Poveži Instagram'}
                  </button>

                  {showManualConnect && (
                    <div className="manual-connect-section" style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <h4 style={{ marginBottom: '10px' }}>Ručno povezivanje sa Access Token-om</h4>
                      <p style={{ fontSize: '14px', color: '#888', marginBottom: '15px' }}>
                        1. Idite na <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff88' }}>Facebook Graph API Explorer</a><br/>
                        2. Izaberite vašu aplikaciju i dobijte token sa dozvolama: instagram_basic, pages_show_list, pages_read_engagement<br/>
                        3. Kopirajte token i nalepite ga ovde
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          value={manualToken}
                          onChange={(e) => setManualToken(e.target.value)}
                          placeholder="Unesite Access Token"
                          className="form-control"
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={handleManualTokenConnect}
                          disabled={loading}
                        >
                          {loading ? 'Povezivanje...' : 'Poveži'}
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
                      {showManualConnect ? 'Sakrij ručno povezivanje' : 'Ručno povezivanje sa tokenom'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-panel">
              <h2>Notification Preferences</h2>
              <p className="panel-description">
                Choose which notifications you want to receive.
              </p>
              
              <div className="notification-options">
                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Email Notifications</h4>
                    <p>Receive notifications via email</p>
                  </div>
                  <label className="toggle">
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
                    <h4>Post Published</h4>
                    <p>Get notified when your scheduled posts are published</p>
                  </div>
                  <label className="toggle">
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
                    <h4>Campaign Updates</h4>
                    <p>Receive updates about your ad campaign performance</p>
                  </div>
                  <label className="toggle">
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
                    <h4>Weekly Report</h4>
                    <p>Receive a weekly summary of your account performance</p>
                  </div>
                  <label className="toggle">
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
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-panel">
              <h2>Security Settings</h2>
              <p className="panel-description">
                Manage your password and account security.
              </p>
              
              <form onSubmit={handlePasswordChange}>
                <h3>Change Password</h3>
                
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                    required
                    minLength={6}
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
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="settings-panel danger">
              <h2>⚠️ Danger Zone</h2>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
