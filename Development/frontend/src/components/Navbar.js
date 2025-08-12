import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaHome, FaSearch, FaBell, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            SocialApp
          </Link>
        </div>

        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <FaHome />
            <span>Home</span>
          </Link>
          
          <Link 
            to="/search" 
            className={`nav-link ${isActive('/search') ? 'active' : ''}`}
          >
            <FaSearch />
            <span>Search</span>
          </Link>
          
          <Link 
            to="/notifications" 
            className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}
          >
            <FaBell />
            <span>Notifications</span>
          </Link>
        </div>

        <div className="navbar-user">
          <div className="user-menu-container">
            <button
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img
                src={user.profilePicture || '/default-avatar.png'}
                alt={user.username}
                className="user-avatar"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <span className="username">{user.username}</span>
            </button>

            {showUserMenu && (
              <div className="user-menu">
                <Link 
                  to={`/profile/${user.username}`}
                  className="user-menu-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FaUser />
                  <span>Profile</span>
                </Link>
                
                <button className="user-menu-item" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
