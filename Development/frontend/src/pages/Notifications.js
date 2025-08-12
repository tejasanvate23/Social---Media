import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaComment, FaUserPlus, FaAtSign, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (page = 1, append = false) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/interactions/notifications', {
        params: { page, limit: 20 }
      });
      
      const { notifications: newNotifications, totalNotifications } = response.data;
      
      if (append) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }
      
      setHasMore(newNotifications.length === 20);
      setCurrentPage(page);
      
      // Count unread notifications
      const unread = newNotifications.filter(n => !n.read).length;
      if (!append) {
        setUnreadCount(unread);
      } else {
        setUnreadCount(prev => prev + unread);
      }
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchNotifications(currentPage + 1, true);
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put('/api/interactions/notifications/read', {
        notificationIds: [notificationId]
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingRead(true);
      await axios.put('/api/interactions/notifications/read-all');
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setMarkingRead(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FaHeart className="notification-icon like" />;
      case 'comment':
        return <FaComment className="notification-icon comment" />;
      case 'follow':
        return <FaUserPlus className="notification-icon follow" />;
      case 'mention':
        return <FaAtSign className="notification-icon mention" />;
      default:
        return <FaHeart className="notification-icon" />;
    }
  };

  const getNotificationText = (notification) => {
    const { type, from, post, content } = notification;
    
    switch (type) {
      case 'like':
        return (
          <>
            <Link to={`/profile/${from.username}`} className="user-link">
              {from.firstName} {from.lastName}
            </Link>
            {' liked your '}
            <Link to={`/post/${post._id}`} className="post-link">
              post
            </Link>
          </>
        );
      
      case 'comment':
        return (
          <>
            <Link to={`/profile/${from.username}`} className="user-link">
              {from.firstName} {from.lastName}
            </Link>
            {' commented on your '}
            <Link to={`/post/${post._id}`} className="post-link">
              post
            </Link>
            {content && (
              <span className="comment-preview">: "{content}"</span>
            )}
          </>
        );
      
      case 'follow':
        return (
          <>
            <Link to={`/profile/${from.username}`} className="user-link">
              {from.firstName} {from.lastName}
            </Link>
            {' started following you'}
          </>
        );
      
      case 'mention':
        return (
          <>
            <Link to={`/profile/${from.username}`} className="user-link">
              {from.firstName} {from.lastName}
            </Link>
            {' mentioned you in a '}
            <Link to={`/post/${post._id}`} className="post-link">
              post
            </Link>
          </>
        );
      
      default:
        return 'You have a new notification';
    }
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-container">
        <div className="loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1 className="notifications-title">Notifications</h1>
        {unreadCount > 0 && (
          <div className="unread-badge">
            {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notifications-actions">
          <button
            className="btn btn-secondary mark-all-read-btn"
            onClick={markAllAsRead}
            disabled={markingRead || unreadCount === 0}
          >
            {markingRead ? (
              <>
                <FaCheckDouble className="action-icon" />
                Marking all as read...
              </>
            ) : (
              <>
                <FaCheckDouble className="action-icon" />
                Mark all as read
              </>
            )}
          </button>
        </div>
      )}

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-content">
              <FaBell className="no-notifications-icon" />
              <h3>No notifications yet</h3>
              <p>When you get likes, comments, or follows, they'll show up here</p>
            </div>
          </div>
        ) : (
          <>
            {notifications.map(notification => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div className="notification-avatar">
                  <img
                    src={notification.from.profilePicture || '/default-avatar.png'}
                    alt={notification.from.username}
                    className="avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div className="notification-type-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                <div className="notification-content">
                  <div className="notification-text">
                    {getNotificationText(notification)}
                  </div>
                  
                  <div className="notification-meta">
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                    
                    {!notification.read && (
                      <button
                        className="mark-read-btn"
                        onClick={() => markAsRead(notification._id)}
                        title="Mark as read"
                      >
                        <FaCheck />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="load-more-container">
                <button
                  className="btn btn-secondary load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Notifications'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
