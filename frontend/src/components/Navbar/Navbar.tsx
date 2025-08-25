// frontend/src/components/Navbar/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/matching', label: 'Matching', icon: '💕' },
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/journal', label: 'Journal', icon: '📝' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand" onClick={closeMobileMenu}>
          <div className="brand-logo">
            <span className="logo-icon">💞</span>
          </div>
          <span className="brand-text">AI Dating App</span>
        </Link>
        
        {user ? (
          <>
            <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`navbar-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-text">{item.label}</span>
                </Link>
              ))}
              
              <div className="navbar-user">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.full_name || user.email}</span>
                    <span className="user-status">Online</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  <span className="logout-icon">🚪</span>
                  <span className="logout-text">Logout</span>
                </button>
              </div>
            </div>

            <button 
              className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </>
        ) : (
          <div className="navbar-menu">
            <Link to="/login" className="navbar-item">
              Login
            </Link>
            <Link to="/register" className="navbar-item register-btn">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
