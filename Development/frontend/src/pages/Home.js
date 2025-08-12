import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import FeedTabs from '../components/FeedTabs';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('personalized');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (page = 1, feedType = activeTab, refresh = false) => {
    try {
      setLoading(true);
      
      let endpoint = '/api/feed';
      if (feedType === 'trending') {
        endpoint = '/api/feed/trending';
      } else if (feedType === 'discover') {
        endpoint = '/api/feed/discover';
      }

      const response = await axios.get(endpoint, {
        params: { page, limit: 10 }
      });

      const { posts: newPosts, totalPages } = response.data;
      
      if (refresh) {
        setPosts(newPosts);
        setCurrentPage(1);
      } else {
        setPosts(prev => page === 1 ? newPosts : [...prev, ...newPosts]);
      }
      
      setHasMore(page < totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, activeTab, true);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPosts(nextPage, activeTab, false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(1, activeTab, true);
    setRefreshing(false);
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    toast.success('Post created successfully!');
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    toast.success('Post deleted successfully!');
  };

  const handlePostInteraction = (postId, updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === postId ? updatedPost : post
    ));
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-main">
          <CreatePost onPostCreated={handlePostCreated} />
          
          <FeedTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />

          <div className="posts-container">
            {posts.length === 0 && !loading ? (
              <div className="no-posts">
                <h3>No posts yet</h3>
                <p>
                  {activeTab === 'personalized' 
                    ? 'Follow some users to see their posts in your feed'
                    : activeTab === 'trending'
                    ? 'No trending posts at the moment'
                    : 'No discovery posts available'
                  }
                </p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  onPostInteraction={handlePostInteraction}
                />
              ))
            )}

            {loading && (
              <div className="loading-posts">
                <div className="loading-spinner"></div>
                <p>Loading posts...</p>
              </div>
            )}

            {hasMore && !loading && posts.length > 0 && (
              <div className="load-more-container">
                <button 
                  className="btn btn-secondary load-more-btn"
                  onClick={handleLoadMore}
                >
                  Load More Posts
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="home-sidebar">
          <div className="sidebar-card">
            <h3>Welcome back, {user.firstName}!</h3>
            <p>Here's what's happening in your network today.</p>
          </div>

          <div className="sidebar-card">
            <h3>Quick Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{user.posts}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{user.followers}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{user.following}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
