import React from 'react';
import './TabNavigation.css';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tab-navigation">
      <button 
        className={activeTab === 'upload' ? 'active' : ''}
        onClick={() => setActiveTab('upload')}
      >
        <i className="fas fa-file-upload"></i>
        <span>Resume Analysis</span>
      </button>
      <button 
        className={activeTab === 'history' ? 'active' : ''}
        onClick={() => setActiveTab('history')}
      >
        <i className="fas fa-history"></i>
        <span>Historical Viewer</span>
      </button>
    </div>
  );
};

export default TabNavigation;