import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <i className="fas fa-file-alt"></i>
            Resume Analyzer
          </Link>
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="fas fa-home"></i>
              Home
            </Link>
            <Link 
              to="/dashboard" 
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="fas fa-chart-bar"></i>
              Dashboard
            </Link>
            <Link 
              to="/upload" 
              className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="fas fa-upload"></i>
              Upload
            </Link>
            <Link 
              to="/history" 
              className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="fas fa-history"></i>
              History
            </Link>
          </div>

          <div className="nav-user">
            <div className="user-info">
              <i className="fas fa-user-circle"></i>
              <span className="user-name">{user.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="logout-button"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>

        <button 
          className="nav-toggle"
          onClick={toggleMenu}
        >
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
