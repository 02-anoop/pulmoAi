/**
 * NAVBAR COMPONENT
 * Modern, animated navigation bar */

import React, { useState, useEffect } from 'react';

const Navbar = ({ currentPage, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToAbout = () => {
    if (currentPage !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const aboutSection = document.querySelector('.about-section');
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const aboutSection = document.querySelector('.about-section');
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => onNavigate('home')}>
          <div className="logo-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="url(#gradient)" strokeWidth="2"/>
              <path d="M20 10 C14 14, 14 18, 20 22 C26 18, 26 14, 20 10Z" fill="url(#gradient2)"/>
              <path d="M20 22 C14 26, 14 30, 20 34 C26 30, 26 26, 20 22Z" fill="url(#gradient2)"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea"/>
                  <stop offset="100%" stopColor="#764ba2"/>
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#764ba2" stopOpacity="0.8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">
            <span className="logo-main">PulmoAI</span>
            <span className="logo-sub">Medical Imaging</span>
          </span>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <button 
            className={`nav-link ${currentPage === 'landing' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button 
            className={`nav-link ${currentPage === 'scan' ? 'active' : ''}`}
            onClick={() => onNavigate('scan')}
          >
            CT Scan Analysis
          </button>
          <button className="nav-link" onClick={scrollToAbout}>
            About
          </button>
        </div>

        {/* Action Button */}
        <div className="navbar-actions">
          <button className="btn-nav-primary" onClick={() => onNavigate('scan')}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3V15M3 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>New Scan</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
