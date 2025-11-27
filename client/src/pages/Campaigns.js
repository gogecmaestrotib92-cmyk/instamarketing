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
  FiCheck,
  FiX,
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
    <div className="campaigns-page">
      <SEO 
        title="Reklamne Kampanje"
        description="Upravljajte Instagram reklamnim kampanjama. A/B testiranje, targetiranje publike, praćenje konverzija i optimizacija budžeta za maksimalan ROI."
        keywords="instagram reklame, reklamne kampanje, instagram ads, targetiranje, konverzije, ROI reklama, facebook ads"
        url="/campaigns"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'Kampanje', url: '/campaigns' }
        ]}
        noindex={true}
      />
      <div className="page-header">
        <div>
          <h1>Reklamne Kampanje</h1>
          <p className="page-subtitle">Kreirajte i upravljajte vašim Instagram reklamnim kampanjama</p>
        </div>
        <Link to="/campaigns/create" className="btn btn-primary">
          <FiPlus /> Kreiraj Kampanju
        </Link>
      </div>

      <div className="filters">
        {[
          { key: 'all', label: 'Sve' },
          { key: 'draft', label: 'Nacrti' },
          { key: 'active', label: 'Aktivne' },
          { key: 'paused', label: 'Pauzirane' },
          { key: 'completed', label: 'Završene' }
        ].map(status => (
          <button
            key={status.key}
            className={`filter-btn ${filter === status.key ? 'active' : ''}`}
            onClick={() => setFilter(status.key)}
          >
            {status.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state-large">
          <FiTarget className="empty-icon" />
          <h3>Nema kampanja</h3>
          <p>Kreirajte vašu prvu reklamnu kampanju da biste dosegli više ljudi</p>
          <Link to="/campaigns/create" className="btn btn-primary">
            <FiPlus /> Kreiraj Kampanju
          </Link>
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map(campaign => (
            <div key={campaign._id} className="campaign-card">
              <div className="campaign-header">
                <div className="campaign-info">
                  <h3>{campaign.name}</h3>
                  <span className="campaign-objective">
                    {getObjectiveLabel(campaign.objective)}
                  </span>
                </div>
                {getStatusBadge(campaign.status)}
              </div>

              <div className="campaign-stats">
                <div className="stat">
                  <FiDollarSign />
                  <div>
                    <span className="stat-value">
                      ${campaign.metrics?.spend?.toFixed(2) || '0.00'}
                    </span>
                    <span className="stat-label">Spent</span>
                  </div>
                </div>
                <div className="stat">
                  <FiEye />
                  <div>
                    <span className="stat-value">
                      {campaign.metrics?.impressions?.toLocaleString() || 0}
                    </span>
                    <span className="stat-label">Impressions</span>
                  </div>
                </div>
                <div className="stat">
                  <FiMousePointer />
                  <div>
                    <span className="stat-value">
                      {campaign.metrics?.clicks?.toLocaleString() || 0}
                    </span>
                    <span className="stat-label">Clicks</span>
                  </div>
                </div>
                <div className="stat">
                  <FiTarget />
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

              <div className="campaign-actions">
                {campaign.status === 'draft' && (
                  <>
                    <Link to={`/campaigns/edit/${campaign._id}`} className="btn btn-ghost btn-sm">
                      <FiEdit2 /> Edit
                    </Link>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleLaunch(campaign._id)}
                    >
                      <FiPlay /> Launch
                    </button>
                  </>
                )}
                {campaign.status === 'active' && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handlePause(campaign._id)}
                  >
                    <FiPause /> Pause
                  </button>
                )}
                {campaign.status === 'paused' && (
                  <>
                    <Link to={`/campaigns/edit/${campaign._id}`} className="btn btn-ghost btn-sm">
                      <FiEdit2 /> Edit
                    </Link>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleResume(campaign._id)}
                    >
                      <FiPlay /> Resume
                    </button>
                  </>
                )}
                <button 
                  className="btn btn-ghost btn-sm danger"
                  onClick={() => handleDelete(campaign._id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Campaigns;
