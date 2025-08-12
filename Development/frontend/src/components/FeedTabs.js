import React from 'react';
import { FaHome, FaFire, FaCompass, FaSync } from 'react-icons/fa';
import './FeedTabs.css';

const FeedTabs = ({ activeTab, onTabChange, onRefresh, refreshing }) => {
  const tabs = [
    {
      id: 'personalized',
      label: 'For You',
      icon: FaHome,
      description: 'Posts from people you follow'
    },
    {
      id: 'trending',
      label: 'Trending',
      icon: FaFire,
      description: 'Most popular posts right now'
    },
    {
      id: 'discover',
      label: 'Discover',
      icon: FaCompass,
      description: 'Find new content and people'
    }
  ];

  return (
    <div className="feed-tabs">
      <div className="tabs-header">
        <div className="tabs-container">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                className={`tab-button ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="tab-icon" />
                <div className="tab-content">
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-description">{tab.description}</span>
                </div>
              </button>
            );
          })}
        </div>
        
        <button
          className="refresh-button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh feed"
        >
          <FaSync className={`refresh-icon ${refreshing ? 'spinning' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default FeedTabs;
