import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { 
  FiPlus, 
  FiImage, 
  FiEdit2, 
  FiTrash2, 
  FiSend,
  FiClock,
  FiCheck,
  FiX,
  FiHeart,
  FiMessageCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import './Posts.css';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await postsAPI.getAll(params);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await postsAPI.publish(id);
      toast.success('Post published successfully!');
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to publish post');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await postsAPI.delete(id);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-default', icon: FiEdit2, label: 'Draft' },
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
        title="Instagram Objave"
        description="Kreirajte, upravljajte i optimizujte Instagram objave. AI asistent za pisanje captiona, izbor hashtag-ova i analiza performansi svake objave."
        keywords="instagram objave, kreiranje posta, upravljanje sadržajem, instagram feed, optimizacija objava"
        url="/posts"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'Objave', url: '/posts' }
        ]}
        noindex={true}
      />
      <div className="page-header">
        <div>
          <h1>Objave</h1>
          <p className="page-subtitle">Upravljajte i zakazujte vaše Instagram objave</p>
        </div>
        <Link to="/posts/create" className="btn btn-primary">
          <FiPlus /> Kreiraj Objavu
        </Link>
      </div>

      {/* Filters */}
      <div className="filters">
        {[
          { key: 'all', label: 'Sve' },
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

      {/* Posts Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state-large">
          <FiImage className="empty-icon" />
          <h3>Nema objava</h3>
          <p>Kreirajte vašu prvu objavu da biste počeli</p>
          <Link to="/posts/create" className="btn btn-primary">
            <FiPlus /> Kreiraj Objavu
          </Link>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <div key={post._id} className="post-card">
              <div className="post-media">
                {post.media?.[0] ? (
                  <img 
                    src={post.media[0].url} 
                    alt="Post preview" 
                    onError={(e) => e.target.src = '/placeholder-image.png'}
                  />
                ) : (
                  <div className="no-media">
                    <FiImage />
                  </div>
                )}
                {post.media?.length > 1 && (
                  <span className="media-count">{post.media.length} images</span>
                )}
              </div>
              
              <div className="post-content">
                <div className="post-header">
                  {getStatusBadge(post.status)}
                  <span className="post-type">{post.type}</span>
                </div>
                
                <p className="post-caption">
                  {post.caption?.substring(0, 100) || 'No caption'}
                  {post.caption?.length > 100 ? '...' : ''}
                </p>

                {post.status === 'published' && (
                  <div className="post-metrics">
                    <span><FiHeart /> {post.metrics?.likes || 0}</span>
                    <span><FiMessageCircle /> {post.metrics?.comments || 0}</span>
                  </div>
                )}

                {post.scheduledFor && post.status === 'scheduled' && (
                  <p className="post-scheduled">
                    <FiClock /> {new Date(post.scheduledFor).toLocaleString()}
                  </p>
                )}

                <div className="post-actions">
                  {['draft', 'scheduled'].includes(post.status) && (
                    <>
                      <Link to={`/posts/edit/${post._id}`} className="btn btn-ghost btn-sm">
                        <FiEdit2 /> Edit
                      </Link>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePublish(post._id)}
                      >
                        <FiSend /> Publish
                      </button>
                    </>
                  )}
                  <button 
                    className="btn btn-ghost btn-sm danger"
                    onClick={() => handleDelete(post._id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <span>Page {pagination.page} of {pagination.pages}</span>
        </div>
      )}
    </div>
  );
};

export default Posts;
