import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import './PostDetail.css';

const PostDetail = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    content: '',
    location: '',
    isPublic: true
  });

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/posts/${id}`);
      const fetchedPost = response.data.post;
      
      setPost(fetchedPost);
      setEditForm({
        content: fetchedPost.content,
        location: fetchedPost.location || '',
        isPublic: fetchedPost.isPublic
      });
      
    } catch (error) {
      console.error('Error fetching post:', error);
      if (error.response?.status === 404) {
        setError('Post not found');
      } else {
        setError('Failed to load post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditForm({
      content: post.content,
      location: post.location || '',
      isPublic: post.isPublic
    });
    setEditing(false);
  };

  const handleSave = async () => {
    if (!editForm.content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    try {
      const response = await axios.put(`/api/posts/${id}`, editForm);
      const updatedPost = response.data.post;
      
      setPost(updatedPost);
      setEditing(false);
      toast.success('Post updated successfully');
      
    } catch (error) {
      console.error('Error updating post:', error);
      const message = error.response?.data?.message || 'Failed to update post';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/posts/${id}`);
      toast.success('Post deleted successfully');
      navigate('/');
      
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePostInteraction = (updatedPost) => {
    setPost(updatedPost);
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  if (loading) {
    return (
      <div className="post-detail-container">
        <div className="loading">Loading post...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-detail-container">
        <div className="error-container">
          <div className="error-content">
            <h2>Oops!</h2>
            <p>{error}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-container">
        <div className="error-container">
          <div className="error-content">
            <h2>Post Not Found</h2>
            <p>The post you're looking for doesn't exist or has been removed.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = currentUser && post.author._id === currentUser._id;

  return (
    <div className="post-detail-container">
      <div className="post-detail-header">
        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>

        {isAuthor && (
          <div className="post-actions">
            <button
              className="btn btn-secondary edit-btn"
              onClick={handleEdit}
            >
              <FaEdit />
              <span>Edit</span>
            </button>
            <button
              className="btn btn-danger delete-btn"
              onClick={handleDelete}
            >
              <FaTrash />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      <div className="post-detail-content">
        {editing ? (
          <div className="edit-form-container">
            <div className="edit-form-header">
              <h2>Edit Post</h2>
            </div>
            
            <form className="edit-form">
              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  name="content"
                  value={editForm.content}
                  onChange={handleInputChange}
                  className="edit-content-input"
                  rows="6"
                  maxLength="5000"
                  placeholder="What's happening?"
                />
                <div className="character-count">
                  {editForm.content.length}/5000
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location (optional)</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={editForm.location}
                  onChange={handleInputChange}
                  className="edit-location-input"
                  placeholder="Add location"
                  maxLength="100"
                />
              </div>

              <div className="form-group">
                <label className="privacy-toggle">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={editForm.isPublic}
                    onChange={handleInputChange}
                    className="privacy-checkbox"
                  />
                  <span className="privacy-text">
                    Make this post public
                  </span>
                </label>
              </div>

              <div className="edit-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary save-btn"
                  onClick={handleSave}
                  disabled={!editForm.content.trim()}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="post-detail-card">
            <div className="post-header">
              <div className="post-author">
                <img
                  src={post.author.profilePicture || '/default-avatar.png'}
                  alt={post.author.username}
                  className="author-avatar"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
                <div className="author-info">
                  <h3 className="author-name">
                    {post.author.firstName} {post.author.lastName}
                  </h3>
                  <span className="author-username">@{post.author.username}</span>
                </div>
              </div>

              <div className="post-meta">
                <span className="post-time">{formatDate(post.createdAt)}</span>
                {post.location && (
                  <span className="post-location">
                    📍 {post.location}
                  </span>
                )}
                <span className="post-privacy">
                  {post.isPublic ? '🌍 Public' : '🔒 Private'}
                </span>
              </div>
            </div>

            <div className="post-content">
              <p className="post-text">{post.content}</p>
              {post.images && post.images.length > 0 && (
                <div className="post-images">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="post-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="post-stats">
              <span className="stat-item">
                ❤️ {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
              </span>
              <span className="stat-item">
                💬 {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <div className="post-interactions">
          <PostCard
            post={post}
            onPostInteraction={handlePostInteraction}
            showFullComments={true}
          />
        </div>
      )}
    </div>
  );
};

export default PostDetail;
