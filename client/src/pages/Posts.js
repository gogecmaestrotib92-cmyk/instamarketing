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
    <main className="posts-page">
      <SEO 
        title="Instagram Posts"
        description="Create, manage and optimize Instagram posts. AI assistant for writing captions, hashtag selection and performance analytics for each post."
        keywords="instagram posts, post creation, content management, instagram feed, post optimization"
        url="/posts"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Posts', url: '/posts' }
        ]}
        noindex={true}
      />
      <header className="page-header">
        <div>
          <h1>Posts</h1>
          <p className="page-subtitle">Manage and schedule your Instagram posts</p>
        </div>
        <Link to="/posts/create" className="btn btn-primary" aria-label="Create new post">
          <FiPlus aria-hidden="true" /> Create Post
        </Link>
      </header>

      {/* Filters */}
      <nav className="filters" aria-label="Post filters">
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

      {/* Posts Grid */}
      {loading ? (
        <div className="loading-container" aria-label="Loading posts">
          <div className="spinner" aria-hidden="true"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state-large">
          <FiImage className="empty-icon" aria-hidden="true" />
          <h3>No posts</h3>
          <p>Create your first post to get started</p>
          <Link to="/posts/create" className="btn btn-primary">
            <FiPlus aria-hidden="true" /> Create Post
          </Link>
        </div>
      ) : (
        <section className="posts-grid" aria-label="Post list">
          {posts.map(post => (
            <article key={post._id} className="post-card">
              <figure className="post-media">
                {post.media?.[0] ? (
                  <img 
                    src={post.media[0].url} 
                    alt={post.caption ? `Preview for post: ${post.caption.substring(0, 20)}...` : "Post preview"} 
                    onError={(e) => e.target.src = '/placeholder-image.png'}
                  />
                ) : (
                  <div className="no-media" aria-label="No image">
                    <FiImage aria-hidden="true" />
                  </div>
                )}
                {post.media?.length > 1 && (
                  <figcaption className="media-count">{post.media.length} images</figcaption>
                )}
              </figure>
              
              <div className="post-content">
                <header className="post-header">
                  {getStatusBadge(post.status)}
                  <span className="post-type">{post.type}</span>
                </header>
                
                <p className="post-caption">
                  {post.caption?.substring(0, 100) || 'No caption'}
                  {post.caption?.length > 100 ? '...' : ''}
                </p>

                {post.status === 'published' && (
                  <div className="post-metrics" aria-label="Post metrics">
                    <span aria-label={`${post.metrics?.likes || 0} likes`}><FiHeart aria-hidden="true" /> {post.metrics?.likes || 0}</span>
                    <span aria-label={`${post.metrics?.comments || 0} comments`}><FiMessageCircle aria-hidden="true" /> {post.metrics?.comments || 0}</span>
                  </div>
                )}

                {post.scheduledFor && post.status === 'scheduled' && (
                  <p className="post-scheduled">
                    <FiClock aria-hidden="true" /> <time dateTime={post.scheduledFor}>{new Date(post.scheduledFor).toLocaleString()}</time>
                  </p>
                )}

                <footer className="post-actions">
                  {['draft', 'scheduled'].includes(post.status) && (
                    <>
                      <Link to={`/posts/edit/${post._id}`} className="btn btn-ghost btn-sm" aria-label={`Edit post ${post.caption?.substring(0, 10)}`}>
                        <FiEdit2 aria-hidden="true" /> Edit
                      </Link>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePublish(post._id)}
                        aria-label={`Publish now ${post.caption?.substring(0, 10)}`}
                      >
                        <FiSend aria-hidden="true" /> Publish
                      </button>
                    </>
                  )}
                  <button 
                    className="btn btn-ghost btn-sm danger"
                    onClick={() => handleDelete(post._id)}
                    aria-label={`Delete post ${post.caption?.substring(0, 10)}`}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </footer>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <nav className="pagination" aria-label="Page navigation">
          <span>Page {pagination.page} of {pagination.pages}</span>
        </nav>
      )}
    </main>
  );
};

export default Posts;
