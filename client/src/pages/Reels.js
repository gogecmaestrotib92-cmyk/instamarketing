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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <main className="posts-page">
      <SEO 
        title="Instagram Reels"
        description="Create viral Instagram reels with AI technology. Automatic video generation, add music, captions and effects. Video marketing for your brand."
        keywords="instagram reels, video marketing, short video content, viral video, AI video generator, instagram video"
        url="/reels"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Reels', url: '/reels' }
        ]}
        noindex={true}
      />
      <header className="page-header">
        <div>
          <h1>Reels</h1>
          <p className="page-subtitle">Create and schedule engaging video content</p>
        </div>
        <Link to="/reels/create" className="btn btn-primary" aria-label="Create new reel">
          <FiPlus aria-hidden="true" /> Create Reel
        </Link>
      </header>

      <nav className="filters" aria-label="Reel filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'draft', label: 'Drafts' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'published', label: 'Published' },
          { key: 'failed', label: 'Failed' }
        ].map(status => (
          <button
            key={status.key}
            className={`filter-btn ${filter === status.key ? 'active' : ''}`}
            onClick={() => setFilter(status.key)}
            aria-current={filter === status.key ? 'page' : undefined}
          >
            {status.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="loading-container" aria-live="polite">
          <div className="spinner" aria-label="Loading..."></div>
        </div>
      ) : reels.length === 0 ? (
        <div className="empty-state-large">
          <FiFilm className="empty-icon" aria-hidden="true" />
          <h3>No reels</h3>
          <p>Create your first reel to get started</p>
          <Link to="/reels/create" className="btn btn-primary">
            <FiPlus aria-hidden="true" /> Create Reel
          </Link>
        </div>
      ) : (
        <div className="posts-grid">
          {reels.map(reel => (
            <article key={reel._id} className="post-card">
              <div className="post-media reel-media">
                {reel.video?.url ? (
                  <>
                    <video src={reel.video.url} aria-label="Video preview" />
                    <div className="play-overlay" aria-hidden="true">
                      <FiPlay />
                    </div>
                  </>
                ) : (
                  <div className="no-media" aria-label="No video">
                    <FiFilm aria-hidden="true" />
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
                  <div className="post-metrics" aria-label="Metrics">
                    <span aria-label={`${reel.metrics?.plays || 0} views`}><FiPlay aria-hidden="true" /> {reel.metrics?.plays || 0}</span>
                    <span aria-label={`${reel.metrics?.likes || 0} likes`}><FiHeart aria-hidden="true" /> {reel.metrics?.likes || 0}</span>
                    <span aria-label={`${reel.metrics?.comments || 0} comments`}><FiMessageCircle aria-hidden="true" /> {reel.metrics?.comments || 0}</span>
                  </div>
                )}

                {reel.scheduledFor && reel.status === 'scheduled' && (
                  <p className="post-scheduled">
                    <FiClock aria-hidden="true" /> {new Date(reel.scheduledFor).toLocaleString()}
                  </p>
                )}

                <div className="post-actions">
                  {['draft', 'scheduled'].includes(reel.status) && (
                    <>
                      <Link to={`/reels/edit/${reel._id}`} className="btn btn-ghost btn-sm" aria-label="Edit reel">
                        <FiEdit2 aria-hidden="true" /> Edit
                      </Link>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePublish(reel._id)}
                        aria-label="Publish reel"
                      >
                        <FiSend aria-hidden="true" /> Publish
                      </button>
                    </>
                  )}
                  <button 
                    className="btn btn-ghost btn-sm danger"
                    onClick={() => handleDelete(reel._id)}
                    aria-label="Delete reel"
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default Reels;
