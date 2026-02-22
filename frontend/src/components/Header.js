/**
 * HEADER COMPONENT
 * ================
 * Application header with branding and navigation
 */

import React from 'react';

const Header = ({ onNavigate, currentPage }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        {/* Logo and Title */}
        <div className="header-left">
          <div className="logo" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">🫁</span>
            <div className="logo-text">
              <h1>Pulmonary Nodule Detection</h1>
              <p className="subtitle">AI-Powered CT Scan Analysis</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="header-right">
          <nav className="header-nav">
            <button 
              className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => onNavigate('home')}
            >
              Home
            </button>
            <button 
              className={`nav-btn ${currentPage === 'scan' ? 'active' : ''}`}
              onClick={() => onNavigate('scan')}
            >
              CT Scan Analysis
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
