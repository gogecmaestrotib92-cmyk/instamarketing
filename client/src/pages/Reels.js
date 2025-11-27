import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reelsAPI } from '../services/api';
import { 
  FiPlus, 
  FiFilm, 
  FiEdit2, 
  FiTrash2, 
  FiSend,
  FiClock,
  FiCheck,
  FiX,
  FiPlay,
  FiHeart,
  FiMessageCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import './Posts.css';

const Reels = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReels();
  }, [filter]);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await reelsAPI.getAll(params);
      setReels(response.data.reels);
    } catch (error) {
      toast.error('Failed to fetch reels');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await reelsAPI.publish(id);
      toast.success('Reel published successfully!');
      fetchReels();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to publish reel');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return;
    
    try {
      await reelsAPI.delete(id);
      toast.success('Reel deleted');
      fetchReels();
    } catch (error) {
      toast.error('Failed to delete reel');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-default', icon: FiEdit2, label: 'Draft' },
      processing: { class: 'badge-info', icon: FiClock, label: 'Processing' },
      scheduled: { class: 'badge-warning', icon: FiClock, label: 'Scheduled' },
      publishing: { class: 'badge-info', icon: FiClock, label: 'Publishing' },
      published: { class: 'badge-success', icon: FiCheck, label: 'Published' },
      failed: { class: 'badge-error', icon: FiX, label: 'Failed' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`badge ${badge.class}`}>
        <badge.icon /> {badge.label}
      </span>
    );
  };

  return (
    <div className="posts-page">
      <SEO 
        title="Instagram Rilsovi"
        description="Kreirajte virusne Instagram rilsove pomoću AI tehnologije. Automatsko generisanje videa, dodavanje muzike, titlova i efekata. Video marketing za vaš brend."
        keywords="instagram reels, rilsovi, video marketing, kratki video sadržaj, viral video, AI video generator, instagram video"
        url="/reels"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'Rilsovi', url: '/reels' }
        ]}
        noindex={true}
      />
      <div className="page-header">
        <div>
          <h1>Rilsovi</h1>
          <p className="page-subtitle">Kreirajte i zakazujte zanimljiv video sadržaj</p>
        </div>
        <Link to="/reels/create" className="btn btn-primary">
          <FiPlus /> Kreiraj Rils
        </Link>
      </div>

      <div className="filters">
        {[
          { key: 'all', label: 'Svi' },
          { key: 'draft', label: 'Nacrti' },
          { key: 'scheduled', label: 'Zakazano' },
          { key: 'published', label: 'Objavljeno' },
          { key: 'failed', label: 'Neuspelo' }
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
      ) : reels.length === 0 ? (
        <div className="empty-state-large">
          <FiFilm className="empty-icon" />
          <h3>Nema rilsova</h3>
          <p>Kreirajte vaš prvi rils da biste počeli</p>
          <Link to="/reels/create" className="btn btn-primary">
            <FiPlus /> Kreiraj Rils
          </Link>
        </div>
      ) : (
        <div className="posts-grid">
          {reels.map(reel => (
            <div key={reel._id} className="post-card">
              <div className="post-media reel-media">
                {reel.video?.url ? (
                  <>
                    <video src={reel.video.url} />
                    <div className="play-overlay">
                      <FiPlay />
                    </div>
                  </>
                ) : (
                  <div className="no-media">
                    <FiFilm />
                  </div>
                )}
              </div>
              
              <div className="post-content">
                <div className="post-header">
                  {getStatusBadge(reel.status)}
                </div>
                
                <p className="post-caption">
                  {reel.caption?.substring(0, 100) || 'No caption'}
                  {reel.caption?.length > 100 ? '...' : ''}
                </p>

                {reel.status === 'published' && (
                  <div className="post-metrics">
                    <span><FiPlay /> {reel.metrics?.plays || 0}</span>
                    <span><FiHeart /> {reel.metrics?.likes || 0}</span>
                    <span><FiMessageCircle /> {reel.metrics?.comments || 0}</span>
                  </div>
                )}

                {reel.scheduledFor && reel.status === 'scheduled' && (
                  <p className="post-scheduled">
                    <FiClock /> {new Date(reel.scheduledFor).toLocaleString()}
                  </p>
                )}

                <div className="post-actions">
                  {['draft', 'scheduled'].includes(reel.status) && (
                    <>
                      <Link to={`/reels/edit/${reel._id}`} className="btn btn-ghost btn-sm">
                        <FiEdit2 /> Edit
                      </Link>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePublish(reel._id)}
                      >
                        <FiSend /> Publish
                      </button>
                    </>
                  )}
                  <button 
                    className="btn btn-ghost btn-sm danger"
                    onClick={() => handleDelete(reel._id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reels;
