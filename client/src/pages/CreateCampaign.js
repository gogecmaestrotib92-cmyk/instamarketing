import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { campaignsAPI } from '../services/api';
import { 
  FiArrowLeft,
  FiArrowRight,
  FiUpload,
  FiX,
  FiDollarSign,
  FiUsers,
  FiTarget,
  FiSave
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import './CreateCampaign.css';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    objective: 'awareness',
    budget: { type: 'daily', amount: 10 },
    schedule: { 
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      runContinuously: false
    },
    targeting: {
      locations: [],
      ageRange: { min: 18, max: 65 },
      genders: ['all'],
      interests: []
    },
    adCreative: {
      headline: '',
      primaryText: '',
      description: '',
      callToAction: 'LEARN_MORE',
      destinationUrl: ''
    }
  });
  const [mediaFiles, setMediaFiles] = useState([]);

  const objectives = [
    { value: 'awareness', label: 'Brand Awareness', desc: 'Increase awareness of your brand' },
    { value: 'reach', label: 'Reach', desc: 'Reach more people' },
    { value: 'traffic', label: 'Traffic', desc: 'Drive traffic to your website' },
    { value: 'engagement', label: 'Engagement', desc: 'Get more engagement on posts' },
    { value: 'leads', label: 'Leads', desc: 'Generate leads for your business' },
    { value: 'sales', label: 'Sales', desc: 'Drive product sales' }
  ];

  const callToActions = [
    'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'BOOK_NOW', 
    'CONTACT_US', 'DOWNLOAD', 'GET_QUOTE', 'APPLY_NOW'
  ];

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setMediaFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    },
    maxFiles: 5
  });

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Please enter a campaign name');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('objective', formData.objective);
      data.append('budget', JSON.stringify(formData.budget));
      data.append('schedule', JSON.stringify(formData.schedule));
      data.append('targeting', JSON.stringify(formData.targeting));
      data.append('adCreative', JSON.stringify(formData.adCreative));

      mediaFiles.forEach(file => {
        data.append('media', file);
      });

      await campaignsAPI.create(data);
      toast.success('Campaign created successfully!');
      navigate('/campaigns');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <h2><FiTarget /> Campaign Objective</h2>
            <p className="step-description">What do you want to achieve?</p>
            
            <div className="form-group">
              <label className="label">Campaign Name</label>
              <input
                type="text"
                className="input"
                placeholder="Enter campaign name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="objectives-grid">
              {objectives.map(obj => (
                <div
                  key={obj.value}
                  className={`objective-card ${formData.objective === obj.value ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, objective: obj.value })}
                >
                  <h4>{obj.label}</h4>
                  <p>{obj.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2><FiDollarSign /> Budget & Schedule</h2>
            <p className="step-description">Set your budget and schedule</p>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Budget Type</label>
                <select
                  className="input"
                  value={formData.budget.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: { ...formData.budget, type: e.target.value }
                  })}
                >
                  <option value="daily">Daily Budget</option>
                  <option value="lifetime">Lifetime Budget</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Amount (USD)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  value={formData.budget.amount}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: { ...formData.budget, amount: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.schedule.startDate}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, startDate: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="label">End Date (Optional)</label>
                <input
                  type="date"
                  className="input"
                  value={formData.schedule.endDate}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, endDate: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2><FiUsers /> Targeting</h2>
            <p className="step-description">Define your target audience</p>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Minimum Age</label>
                <input
                  type="number"
                  className="input"
                  min="13"
                  max="65"
                  value={formData.targeting.ageRange.min}
                  onChange={(e) => setFormData({
                    ...formData,
                    targeting: {
                      ...formData.targeting,
                      ageRange: { ...formData.targeting.ageRange, min: parseInt(e.target.value) }
                    }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="label">Maximum Age</label>
                <input
                  type="number"
                  className="input"
                  min="13"
                  max="65"
                  value={formData.targeting.ageRange.max}
                  onChange={(e) => setFormData({
                    ...formData,
                    targeting: {
                      ...formData.targeting,
                      ageRange: { ...formData.targeting.ageRange, max: parseInt(e.target.value) }
                    }
                  })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Gender</label>
              <select
                className="input"
                value={formData.targeting.genders[0]}
                onChange={(e) => setFormData({
                  ...formData,
                  targeting: { ...formData.targeting, genders: [e.target.value] }
                })}
              >
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Interests (comma separated)</label>
              <input
                type="text"
                className="input"
                placeholder="fitness, fashion, technology"
                onChange={(e) => setFormData({
                  ...formData,
                  targeting: {
                    ...formData.targeting,
                    interests: e.target.value.split(',').map(i => ({ name: i.trim() })).filter(i => i.name)
                  }
                })}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2><FiUpload /> Ad Creative</h2>
            <p className="step-description">Create your ad content</p>

            <div {...getRootProps()} className="dropzone">
              <input {...getInputProps()} />
              <FiUpload className="dropzone-icon" />
              <p>Add images or videos for your ad</p>
            </div>

            {mediaFiles.length > 0 && (
              <div className="media-preview-grid">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="media-preview-item">
                    {file.type.startsWith('video') ? (
                      <video src={file.preview} />
                    ) : (
                      <img src={file.preview} alt="" />
                    )}
                    <button 
                      className="remove-media"
                      onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="label">Headline</label>
              <input
                type="text"
                className="input"
                placeholder="Catchy headline for your ad"
                value={formData.adCreative.headline}
                onChange={(e) => setFormData({
                  ...formData,
                  adCreative: { ...formData.adCreative, headline: e.target.value }
                })}
              />
            </div>

            <div className="form-group">
              <label className="label">Primary Text</label>
              <textarea
                className="input textarea"
                placeholder="Main ad copy"
                value={formData.adCreative.primaryText}
                onChange={(e) => setFormData({
                  ...formData,
                  adCreative: { ...formData.adCreative, primaryText: e.target.value }
                })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Call to Action</label>
                <select
                  className="input"
                  value={formData.adCreative.callToAction}
                  onChange={(e) => setFormData({
                    ...formData,
                    adCreative: { ...formData.adCreative, callToAction: e.target.value }
                  })}
                >
                  {callToActions.map(cta => (
                    <option key={cta} value={cta}>{cta.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Destination URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://yourwebsite.com"
                  value={formData.adCreative.destinationUrl}
                  onChange={(e) => setFormData({
                    ...formData,
                    adCreative: { ...formData.adCreative, destinationUrl: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="create-campaign-page">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/campaigns')}>
          <FiArrowLeft /> Back
        </button>
        <h1>Create Ad Campaign</h1>
      </div>

      {/* Progress Steps */}
      <div className="steps-progress">
        {[1, 2, 3, 4].map(s => (
          <div 
            key={s} 
            className={`step ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
            onClick={() => setStep(s)}
          >
            <div className="step-number">{s}</div>
            <span>{['Objective', 'Budget', 'Targeting', 'Creative'][s-1]}</span>
          </div>
        ))}
      </div>

      <div className="card">
        {renderStep()}

        <div className="step-actions">
          {step > 1 && (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              <FiArrowLeft /> Previous
            </button>
          )}
          {step < 4 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Next <FiArrowRight />
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              <FiSave /> {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
