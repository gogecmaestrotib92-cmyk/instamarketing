import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignsAPI } from '../services/api';
import { 
  FiPlus, 
  FiTarget, 
  FiEdit2, 
  FiTrash2, 
  FiPlay,
  FiPause,
  FiDollarSign,
  FiEye,
  FiMousePointer
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import './Campaigns.css';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await campaignsAPI.getAll(params);
      setCampaigns(response.data.campaigns);
    } catch (error) {
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (id) => {
    try {
      await campaignsAPI.launch(id);
      toast.success('Campaign launched!');
      fetchCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to launch campaign');
    }
  };

  const handlePause = async (id) => {
    try {
      await campaignsAPI.pause(id);
      toast.success('Campaign paused');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to pause campaign');
    }
  };

  const handleResume = async (id) => {
    try {
      await campaignsAPI.resume(id);
      toast.success('Campaign resumed');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to resume campaign');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await campaignsAPI.delete(id);
      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-default', label: 'Draft' },
      pending_review: { class: 'badge-warning', label: 'Pending Review' },
      active: { class: 'badge-success', label: 'Active' },
      paused: { class: 'badge-info', label: 'Paused' },
      completed: { class: 'badge-default', label: 'Completed' },
      rejected: { class: 'badge-error', label: 'Rejected' }
    };
    const badge = badges[status] || badges.draft;
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const getObjectiveLabel = (objective) => {
    const labels = {
      awareness: 'Brand Awareness',
      reach: 'Reach',
      traffic: 'Traffic',
      engagement: 'Engagement',
      leads: 'Lead Generation',
      sales: 'Sales',
      app_installs: 'App Installs'
    };
    return labels[objective] || objective;
  };

  return (
    <main className="campaigns-page">
      <SEO 
        title="Ad Campaigns"
        description="Manage Instagram ad campaigns. A/B testing, audience targeting, conversion tracking and budget optimization for maximum ROI."
        keywords="instagram ads, ad campaigns, instagram advertising, targeting, conversions, ad ROI, facebook ads"
        url="/campaigns"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Campaigns', url: '/campaigns' }
        ]}
        noindex={true}
      />
      <header className="page-header">
        <div>
          <h1>Ad Campaigns</h1>
          <p className="page-subtitle">Create and manage your Instagram ad campaigns</p>
        </div>
        <Link to="/campaigns/create" className="btn btn-primary" aria-label="Create new campaign">
          <FiPlus aria-hidden="true" /> Create Campaign
        </Link>
      </header>

      <div className="filters" role="group" aria-label="Campaign filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'draft', label: 'Drafts' },
          { key: 'active', label: 'Active' },
          { key: 'paused', label: 'Paused' },
          { key: 'completed', label: 'Completed' }
        ].map(status => (
          <button
            key={status.key}
            className={`filter-btn ${filter === status.key ? 'active' : ''}`}
            onClick={() => setFilter(status.key)}
            aria-pressed={filter === status.key}
          >
            {status.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container" aria-live="polite">
          <div className="spinner" aria-label="Loading campaigns..."></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state-large">
          <FiTarget className="empty-icon" aria-hidden="true" />
          <h3>No campaigns</h3>
          <p>Create your first ad campaign to reach more people</p>
          <Link to="/campaigns/create" className="btn btn-primary">
            <FiPlus aria-hidden="true" /> Create Campaign
          </Link>
        </div>
      ) : (
        <section className="campaigns-list" aria-label="Campaign list">
          {campaigns.map(campaign => (
            <article key={campaign._id} className="campaign-card">
              <header className="campaign-header">
                <div className="campaign-info">
                  <h3>{campaign.name}</h3>
                  <span className="campaign-objective">
                    {getObjectiveLabel(campaign.objective)}
                  </span>
                </div>
                {getStatusBadge(campaign.status)}
              </header>

              <div className="campaign-stats">
                <div className="stat">
                  <FiDollarSign aria-hidden="true" />
                  <div>
                    <span className="stat-value">
                      ${campaign.metrics?.spend?.toFixed(2) || '0.00'}
                    </span>
                    <span className="stat-label">Spent</span>
                  </div>
                </div>
                <div className="stat">
                  <FiEye aria-hidden="true" />
                  <div>
                    <span className="stat-value">
                      {campaign.metrics?.impressions?.toLocaleString() || 0}
                    </span>
                    <span className="stat-label">Impressions</span>
                  </div>
                </div>
                <div className="stat">
                  <FiMousePointer aria-hidden="true" />
                  <div>
                    <span className="stat-value">
                      {campaign.metrics?.clicks?.toLocaleString() || 0}
                    </span>
                    <span className="stat-label">Clicks</span>
                  </div>
                </div>
                <div className="stat">
                  <FiTarget aria-hidden="true" />
                  <div>
                    <span className="stat-value">
                      {campaign.metrics?.conversions || 0}
                    </span>
                    <span className="stat-label">Conversions</span>
                  </div>
                </div>
              </div>

              <div className="campaign-budget">
                <span>Budget: ${campaign.budget?.amount || 0} / {campaign.budget?.type || 'day'}</span>
                <span>
                  {new Date(campaign.schedule?.startDate).toLocaleDateString()} 
                  {campaign.schedule?.endDate && ` - ${new Date(campaign.schedule.endDate).toLocaleDateString()}`}
                </span>
              </div>

              <footer className="campaign-actions">
                {campaign.status === 'draft' && (
                  <>
                    <Link to={`/campaigns/edit/${campaign._id}`} className="btn btn-ghost btn-sm" aria-label={`Edit campaign ${campaign.name}`}>
                      <FiEdit2 aria-hidden="true" /> Edit
                    </Link>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleLaunch(campaign._id)}
                      aria-label={`Launch campaign ${campaign.name}`}
                    >
                      <FiPlay aria-hidden="true" /> Launch
                    </button>
                  </>
                )}
                {campaign.status === 'active' && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handlePause(campaign._id)}
                    aria-label={`Pause campaign ${campaign.name}`}
                  >
                    <FiPause aria-hidden="true" /> Pause
                  </button>
                )}
                {campaign.status === 'paused' && (
                  <>
                    <Link to={`/campaigns/edit/${campaign._id}`} className="btn btn-ghost btn-sm" aria-label={`Edit campaign ${campaign.name}`}>
                      <FiEdit2 aria-hidden="true" /> Edit
                    </Link>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleResume(campaign._id)}
                      aria-label={`Resume campaign ${campaign.name}`}
                    >
                      <FiPlay aria-hidden="true" /> Resume
                    </button>
                  </>
                )}
                <button 
                  className="btn btn-ghost btn-sm danger"
                  onClick={() => handleDelete(campaign._id)}
                  aria-label={`Delete campaign ${campaign.name}`}
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              </footer>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default Campaigns;
