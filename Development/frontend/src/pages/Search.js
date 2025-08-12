import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSearch, FaUser, FaFileAlt, FaUserPlus, FaUserMinus } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import './Search.css';

const Search = () => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('users'); // 'users' or 'posts'
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    // Clear results when search type changes
    setUsers([]);
    setPosts([]);
    setHasSearched(false);
    setCurrentPage(1);
    setHasMore(false);
  }, [searchType]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      if (searchType === 'users') {
        const response = await axios.get('/api/users/search', {
          params: { q: searchQuery.trim() }
        });
        setUsers(response.data.users);
        setHasMore(false); // User search doesn't have pagination in current API
      } else {
        // For posts, we'll implement a simple search
        // This would typically be a separate API endpoint
        const response = await axios.get('/api/posts', {
          params: { 
            page: 1, 
            limit: 10,
            search: searchQuery.trim()
          }
        });
        setPosts(response.data.posts);
        setHasMore(response.data.posts.length === 10);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (searchType !== 'posts' || !hasMore || loading) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/posts', {
        params: { 
          page: currentPage + 1, 
          limit: 10,
          search: searchQuery.trim()
        }
      });
      
      setPosts(prev => [...prev, ...response.data.posts]);
      setCurrentPage(prev => prev + 1);
      setHasMore(response.data.posts.length === 10);
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await axios.delete(`/api/users/follow/${userId}`);
        toast.success('Unfollowed successfully');
      } else {
        await axios.post(`/api/users/follow/${userId}`);
        toast.success('Followed successfully');
      }
      
      // Update the users list to reflect the follow status change
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, isFollowing: !isFollowing }
          : user
      ));
    } catch (error) {
      console.error('Follow error:', error);
      const message = error.response?.data?.message || 'Failed to follow/unfollow';
      toast.error(message);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const handlePostInteraction = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setUsers([]);
    setPosts([]);
    setHasSearched(false);
    setCurrentPage(1);
    setHasMore(false);
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1 className="search-title">Search</h1>
        <p className="search-subtitle">Find people and posts</p>
      </div>

      <div className="search-form-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users or posts..."
                className="search-input"
                disabled={loading}
              />
            </div>
            
            <div className="search-type-toggle">
              <button
                type="button"
                className={`toggle-btn ${searchType === 'users' ? 'active' : ''}`}
                onClick={() => setSearchType('users')}
                disabled={loading}
              >
                <FaUser />
                <span>Users</span>
              </button>
              <button
                type="button"
                className={`toggle-btn ${searchType === 'posts' ? 'active' : ''}`}
                onClick={() => setSearchType('posts')}
                disabled={loading}
              >
                <FaFileAlt />
                <span>Posts</span>
              </button>
            </div>
          </div>

          <div className="search-actions">
            <button
              type="submit"
              className="btn btn-primary search-btn"
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            
            {hasSearched && (
              <button
                type="button"
                className="btn btn-secondary clear-btn"
                onClick={clearSearch}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {hasSearched && (
        <div className="search-results">
          {searchType === 'users' ? (
            <div className="users-results">
              <h2 className="results-title">
                {loading ? 'Searching...' : `Found ${users.length} user${users.length !== 1 ? 's' : ''}`}
              </h2>
              
              {users.length === 0 && !loading ? (
                <div className="no-results">
                  <p>No users found matching "{searchQuery}"</p>
                  <p>Try a different search term</p>
                </div>
              ) : (
                <div className="users-grid">
                  {users.map(user => (
                    <div key={user._id} className="user-card">
                      <div className="user-info">
                        <Link to={`/profile/${user.username}`} className="user-link">
                          <img
                            src={user.profilePicture || '/default-avatar.png'}
                            alt={user.username}
                            className="user-avatar"
                            onError={(e) => {
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                          <div className="user-details">
                            <h3 className="user-name">
                              {user.firstName} {user.lastName}
                            </h3>
                            <span className="user-username">@{user.username}</span>
                          </div>
                        </Link>
                      </div>
                      
                      {user._id !== currentUser._id && (
                        <button
                          className={`btn ${user.isFollowing ? 'btn-secondary' : 'btn-primary'} follow-btn`}
                          onClick={() => handleFollow(user._id, user.isFollowing)}
                        >
                          {user.isFollowing ? <FaUserMinus /> : <FaUserPlus />}
                          <span>{user.isFollowing ? 'Unfollow' : 'Follow'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="posts-results">
              <h2 className="results-title">
                {loading ? 'Searching...' : `Found ${posts.length} post${posts.length !== 1 ? 's' : ''}`}
              </h2>
              
              {posts.length === 0 && !loading ? (
                <div className="no-results">
                  <p>No posts found matching "{searchQuery}"</p>
                  <p>Try a different search term</p>
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
                  
                  {hasMore && (
                    <div className="load-more-container">
                      <button
                        className="btn btn-secondary load-more-btn"
                        onClick={handleLoadMore}
                        disabled={loading}
                      >
                        {loading ? 'Loading...' : 'Load More Posts'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="search-placeholder">
          <div className="placeholder-content">
            <FaSearch className="placeholder-icon" />
            <h3>Start searching</h3>
            <p>Search for users to follow or posts to discover</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
