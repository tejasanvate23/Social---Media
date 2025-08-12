import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaEdit, FaSave, FaTimes, FaUserPlus, FaUserMinus, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  });
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const isOwnProfile = currentUser && profileUser && currentUser.username === profileUser.username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (profileUser) {
      fetchPosts();
      checkFollowStatus();
    }
  }, [profileUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/profile/${username}`);
      const { user, posts: userPosts } = response.data;
      
      setProfileUser(user);
      setPosts(userPosts);
      setFollowersCount(user.followers);
      setFollowingCount(user.following);
      setPostsCount(user.posts);
      
      // Initialize edit form
      setEditForm({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || ''
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 404) {
        toast.error('User not found');
        navigate('/');
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (page = 1, append = false) => {
    try {
      setPostsLoading(true);
      const response = await axios.get(`/api/posts/user/${profileUser._id}`, {
        params: { page, limit: 10 }
      });
      
      const { posts: newPosts, hasMore } = response.data;
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMorePosts(newPosts.length === 10);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || !profileUser) return;
    
    try {
      const response = await axios.get(`/api/users/profile/${username}`);
      const { user } = response.data;
      setFollowing(user.followers.includes(currentUser._id));
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;
    
    try {
      if (following) {
        await axios.delete(`/api/users/follow/${profileUser._id}`);
        setFollowersCount(prev => prev - 1);
        toast.success('Unfollowed successfully');
      } else {
        await axios.post(`/api/users/follow/${profileUser._id}`);
        setFollowersCount(prev => prev + 1);
        toast.success('Followed successfully');
      }
      
      setFollowing(!following);
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      const message = error.response?.data?.message || 'Failed to follow/unfollow';
      toast.error(message);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditForm({
      firstName: profileUser.firstName,
      lastName: profileUser.lastName,
      bio: profileUser.bio || ''
    });
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      const response = await axios.put('/api/users/profile', editForm);
      const { user } = response.data;
      
      setProfileUser(user);
      setEditing(false);
      toast.success('Profile updated successfully');
      
      // Update current user context if editing own profile
      if (isOwnProfile) {
        // You might want to update the auth context here
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoadMorePosts = () => {
    if (!postsLoading && hasMorePosts) {
      fetchPosts(currentPage + 1, true);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    setPostsCount(prev => prev - 1);
  };

  const handlePostInteraction = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
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
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-container">
        <div className="error">User not found</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-avatar-container">
            <img
              src={profileUser.profilePicture || '/default-avatar.png'}
              alt={profileUser.username}
              className="profile-avatar"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}
            />
          </div>
        </div>
        
        <div className="profile-info">
          <div className="profile-main">
            <div className="profile-name-section">
              <h1 className="profile-name">
                {editing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleInputChange}
                    className="edit-input name-input"
                    maxLength="50"
                  />
                ) : (
                  `${profileUser.firstName} ${profileUser.lastName}`
                )}
              </h1>
              
              {editing && (
                <input
                  type="text"
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleInputChange}
                  className="edit-input name-input"
                  maxLength="50"
                />
              )}
              
              <span className="profile-username">@{profileUser.username}</span>
            </div>

            <div className="profile-actions">
              {isOwnProfile ? (
                editing ? (
                  <>
                    <button className="btn btn-primary save-btn" onClick={handleSave}>
                      <FaSave />
                      <span>Save</span>
                    </button>
                    <button className="btn btn-secondary cancel-btn" onClick={handleCancel}>
                      <FaTimes />
                      <span>Cancel</span>
                    </button>
                  </>
                ) : (
                  <button className="btn btn-secondary edit-btn" onClick={handleEdit}>
                    <FaEdit />
                    <span>Edit Profile</span>
                  </button>
                )
              ) : (
                <button
                  className={`btn ${following ? 'btn-secondary' : 'btn-primary'} follow-btn`}
                  onClick={handleFollow}
                >
                  {following ? <FaUserMinus /> : <FaUserPlus />}
                  <span>{following ? 'Unfollow' : 'Follow'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="profile-bio">
            {editing ? (
              <textarea
                name="bio"
                value={editForm.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                className="edit-input bio-input"
                maxLength="500"
                rows="3"
              />
            ) : (
              profileUser.bio || 'No bio yet'
            )}
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{postsCount}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{followersCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{followingCount}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>

          <div className="profile-meta">
            <div className="meta-item">
              <FaCalendarAlt className="meta-icon" />
              <span>Joined {formatDate(profileUser.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="content-header">
          <h2 className="content-title">Posts</h2>
        </div>

        <div className="posts-section">
          {posts.length === 0 ? (
            <div className="no-posts">
              <p>No posts yet</p>
              {isOwnProfile && (
                <p>Start sharing your thoughts with the world!</p>
              )}
            </div>
          ) : (
            <>
              <div className="posts-list">
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onPostDeleted={handlePostDeleted}
                    onPostInteraction={handlePostInteraction}
                  />
                ))}
              </div>

              {hasMorePosts && (
                <div className="load-more-container">
                  <button
                    className="btn btn-secondary load-more-btn"
                    onClick={handleLoadMorePosts}
                    disabled={postsLoading}
                  >
                    {postsLoading ? 'Loading...' : 'Load More Posts'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
