import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaImage, FaMapMarkerAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import './CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    content: '',
    location: '',
    isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast.error('Please write something to post');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('/api/posts', formData);
      const newPost = response.data.post;
      
      // Reset form
      setFormData({
        content: '',
        location: '',
        isPublic: true
      });
      
      setShowForm(false);
      
      // Notify parent component
      onPostCreated(newPost);
      
    } catch (error) {
      console.error('Error creating post:', error);
      const message = error.response?.data?.message || 'Failed to create post';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      content: '',
      location: '',
      isPublic: true
    });
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <div className="create-post-trigger">
        <div className="trigger-content" onClick={() => setShowForm(true)}>
          <img
            src={user.profilePicture || '/default-avatar.png'}
            alt={user.username}
            className="user-avatar"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
          <span className="trigger-text">What's happening?</span>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post">
      <div className="post-header">
        <img
          src={user.profilePicture || '/default-avatar.png'}
          alt={user.username}
          className="user-avatar"
          onError={(e) => {
            e.target.src = '/default-avatar.png';
          }}
        />
        <div className="post-form-container">
          <form onSubmit={handleSubmit} className="post-form">
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="What's happening?"
              className="post-content-input"
              rows="3"
              maxLength="5000"
              disabled={loading}
            />
            
            <div className="post-options">
              <div className="option-row">
                <div className="location-input">
                  <FaMapMarkerAlt className="option-icon" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Add location (optional)"
                    className="location-field"
                    disabled={loading}
                  />
                </div>
                
                <div className="privacy-toggle">
                  <label className="privacy-label">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleChange}
                      className="privacy-checkbox"
                      disabled={loading}
                    />
                    <span className="privacy-text">
                      {formData.isPublic ? (
                        <>
                          <FaEye className="privacy-icon" />
                          Public
                        </>
                      ) : (
                        <>
                          <FaEyeSlash className="privacy-icon" />
                          Private
                        </>
                      )}
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="character-count">
                {formData.content.length}/5000
              </div>
            </div>
            
            <div className="post-actions">
              <button
                type="button"
                className="btn btn-secondary cancel-btn"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary post-btn"
                disabled={loading || !formData.content.trim()}
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
