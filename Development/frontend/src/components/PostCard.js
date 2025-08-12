import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaHeart, FaComment, FaShare, FaEllipsisH, FaTrash, FaEdit } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import './PostCard.css';

const PostCard = ({ post, onPostUpdated, onPostDeleted, onPostInteraction }) => {
  const { user } = useAuth();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [liking, setLiking] = useState(false);

  const isLiked = post.likes.some(like => like._id === user._id);
  const isAuthor = post.author._id === user._id;

  const handleLike = async () => {
    if (liking) return;
    
    setLiking(true);
    try {
      const response = await axios.post(`/api/interactions/like/${post._id}`);
      const { post: updatedPost, isLiked: newLikeState } = response.data;
      
      // Update the post in the parent component
      if (onPostInteraction) {
        onPostInteraction(updatedPost);
      }
      
      toast.success(newLikeState ? 'Post liked!' : 'Post unliked!');
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!commentContent.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await axios.post(`/api/interactions/comment/${post._id}`, {
        content: commentContent
      });
      
      const { post: updatedPost } = response.data;
      
      // Update the post in the parent component
      if (onPostInteraction) {
        onPostInteraction(updatedPost);
      }
      
      setCommentContent('');
      setShowCommentForm(false);
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      const message = error.response?.data?.message || 'Failed to add comment';
      toast.error(message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await axios.delete(`/api/interactions/comment/${post._id}/${commentId}`);
      const { post: updatedPost } = response.data;
      
      // Update the post in the parent component
      if (onPostInteraction) {
        onPostInteraction(updatedPost);
      }
      
      toast.success('Comment deleted!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`/api/posts/${post._id}`);
      
      // Notify parent component
      if (onPostDeleted) {
        onPostDeleted(post._id);
      }
      
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleEditPost = () => {
    // This would typically open an edit modal or navigate to edit page
    // For now, we'll just show a toast
    toast.info('Edit functionality coming soon!');
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          <Link to={`/profile/${post.author.username}`} className="author-link">
            <img
              src={post.author.profilePicture || '/default-avatar.png'}
              alt={post.author.username}
              className="author-avatar"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}
            />
            <div className="author-info">
              <span className="author-name">
                {post.author.firstName} {post.author.lastName}
              </span>
              <span className="author-username">@{post.author.username}</span>
            </div>
          </Link>
        </div>

        <div className="post-meta">
          <span className="post-time">{formatDate(post.createdAt)}</span>
          {post.location && (
            <span className="post-location">
              <i className="location-icon">📍</i> {post.location}
            </span>
          )}
        </div>

        {isAuthor && (
          <div className="post-options">
            <button
              className="options-trigger"
              onClick={() => setShowOptions(!showOptions)}
            >
              <FaEllipsisH />
            </button>
            
            {showOptions && (
              <div className="options-menu">
                <button
                  className="option-item"
                  onClick={handleEditPost}
                >
                  <FaEdit />
                  <span>Edit</span>
                </button>
                <button
                  className="option-item delete"
                  onClick={handleDeletePost}
                >
                  <FaTrash />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
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
          <FaHeart className="stat-icon" />
          {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
        </span>
        <span className="stat-item">
          <FaComment className="stat-icon" />
          {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      <div className="post-actions">
        <button
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={liking}
        >
          <FaHeart className="action-icon" />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          className="action-btn comment-btn"
          onClick={() => setShowCommentForm(!showCommentForm)}
        >
          <FaComment className="action-icon" />
          <span>Comment</span>
        </button>

        <button className="action-btn share-btn">
          <FaShare className="action-icon" />
          <span>Share</span>
        </button>
      </div>

      {showCommentForm && (
        <div className="comment-form-container">
          <form onSubmit={handleComment} className="comment-form">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write a comment..."
              className="comment-input"
              rows="2"
              maxLength="1000"
              disabled={submittingComment}
            />
            <div className="comment-form-actions">
              <button
                type="button"
                className="btn btn-secondary cancel-btn"
                onClick={() => {
                  setShowCommentForm(false);
                  setCommentContent('');
                }}
                disabled={submittingComment}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary submit-btn"
                disabled={submittingComment || !commentContent.trim()}
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {post.comments.length > 0 && (
        <div className="comments-section">
          <div className="comments-header">
            <span className="comments-title">Comments</span>
          </div>
          
          <div className="comments-list">
            {post.comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <div className="comment-author">
                  <Link to={`/profile/${comment.user.username}`}>
                    <img
                      src={comment.user.profilePicture || '/default-avatar.png'}
                      alt={comment.user.username}
                      className="comment-avatar"
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                  </Link>
                  <div className="comment-content">
                    <div className="comment-header">
                      <Link to={`/profile/${comment.user.username}`} className="comment-author-name">
                        {comment.user.firstName} {comment.user.lastName}
                      </Link>
                      <span className="comment-time">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                </div>
                
                {(comment.user._id === user._id || isAuthor) && (
                  <button
                    className="delete-comment-btn"
                    onClick={() => handleDeleteComment(comment._id)}
                    title="Delete comment"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
