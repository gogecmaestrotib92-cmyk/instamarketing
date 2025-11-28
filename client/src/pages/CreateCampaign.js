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
          <fieldset className="step-content">
            <legend className="sr-only">Campaign Objective</legend>
            <h2><FiTarget aria-hidden="true" /> Campaign Objective</h2>
            <p className="step-description">What do you want to achieve?</p>
            
            <div className="form-group">
              <label htmlFor="campaignName" className="label">Campaign Name</label>
              <input
                id="campaignName"
                type="text"
                className="input"
                placeholder="Enter campaign name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="objectives-grid" role="radiogroup" aria-label="Campaign Objectives">
              {objectives.map(obj => (
                <div
                  key={obj.value}
                  className={`objective-card ${formData.objective === obj.value ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, objective: obj.value })}
                  role="radio"
                  aria-checked={formData.objective === obj.value}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setFormData({ ...formData, objective: obj.value });
                    }
                  }}
                >
                  <h4>{obj.label}</h4>
                  <p>{obj.desc}</p>
                </div>
              ))}
            </div>
          </fieldset>
        );

      case 2:
        return (
          <fieldset className="step-content">
            <legend className="sr-only">Budget & Schedule</legend>
            <h2><FiDollarSign aria-hidden="true" /> Budget & Schedule</h2>
            <p className="step-description">Set your budget and schedule</p>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="budgetType" className="label">Budget Type</label>
                <select
                  id="budgetType"
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
                <label htmlFor="budgetAmount" className="label">Amount (USD)</label>
                <input
                  id="budgetAmount"
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
                <label htmlFor="startDate" className="label">Start Date</label>
                <input
                  id="startDate"
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
                <label htmlFor="endDate" className="label">End Date (Optional)</label>
                <input
                  id="endDate"
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
          </fieldset>
        );

      case 3:
        return (
          <fieldset className="step-content">
            <legend className="sr-only">Targeting</legend>
            <h2><FiUsers aria-hidden="true" /> Targeting</h2>
            <p className="step-description">Define your target audience</p>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minAge" className="label">Minimum Age</label>
                <input
                  id="minAge"
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
                <label htmlFor="maxAge" className="label">Maximum Age</label>
                <input
                  id="maxAge"
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
              <label htmlFor="gender" className="label">Gender</label>
              <select
                id="gender"
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
              <label htmlFor="interests" className="label">Interests (comma separated)</label>
              <input
                id="interests"
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
          </fieldset>
        );

      case 4:
        return (
          <fieldset className="step-content">
            <legend className="sr-only">Ad Creative</legend>
            <h2><FiUpload aria-hidden="true" /> Ad Creative</h2>
            <p className="step-description">Create your ad content</p>

            <div {...getRootProps()} className="dropzone" role="button" aria-label="Upload media" tabIndex={0}>
              <input {...getInputProps()} />
              <FiUpload className="dropzone-icon" aria-hidden="true" />
              <p>Add images or videos for your ad</p>
            </div>

            {mediaFiles.length > 0 && (
              <div className="media-preview-grid" aria-label="Uploaded media previews">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="media-preview-item">
                    {file.type.startsWith('video') ? (
                      <video src={file.preview} aria-label={`Video preview ${index + 1}`} />
                    ) : (
                      <img src={file.preview} alt={`Preview ${index + 1}`} />
                    )}
                    <button 
                      className="remove-media"
                      onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                      aria-label={`Remove media ${index + 1}`}
                    >
                      <FiX aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="headline" className="label">Headline</label>
              <input
                id="headline"
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
              <label htmlFor="primaryText" className="label">Primary Text</label>
              <textarea
                id="primaryText"
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
                <label htmlFor="callToAction" className="label">Call to Action</label>
                <select
                  id="callToAction"
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
                <label htmlFor="destinationUrl" className="label">Destination URL</label>
                <input
                  id="destinationUrl"
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
          </fieldset>
        );

      default:
        return null;
    }
  };

  return (
    <main className="create-campaign-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/campaigns')} aria-label="Go back to campaigns">
          <FiArrowLeft aria-hidden="true" /> Back
        </button>
        <h1>Create Ad Campaign</h1>
      </header>

      {/* Progress Steps */}
      <nav aria-label="Progress">
        <ol className="steps-progress">
          {[1, 2, 3, 4].map(s => (
            <li 
              key={s} 
              className={`step ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
              onClick={() => setStep(s)}
              aria-current={step === s ? 'step' : undefined}
            >
              <div className="step-number">{s}</div>
              <span>{['Objective', 'Budget', 'Targeting', 'Creative'][s-1]}</span>
            </li>
          ))}
        </ol>
      </nav>

      <form className="card" onSubmit={(e) => e.preventDefault()}>
        {renderStep()}

        <div className="step-actions">
          {step > 1 && (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              <FiArrowLeft aria-hidden="true" /> Previous
            </button>
          )}
          {step < 4 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Next <FiArrowRight aria-hidden="true" />
            </button>
          ) : (
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              <FiSave aria-hidden="true" /> {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
};

export default CreateCampaign;
