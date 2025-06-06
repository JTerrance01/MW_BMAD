import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Logo.css';

const Logo = ({ className = '', width = 120 }) => {
  const [isToggled, setIsToggled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleToggle = (e) => {
    e.preventDefault();
    
    // Always toggle the faders for visual feedback
    setIsToggled(!isToggled);
    
    // Only navigate if we're not already on the homepage
    if (location.pathname !== '/') {
      setTimeout(() => {
        navigate('/');
      }, 150); // Navigate after showing animation
    }
  };

  return (
    <Link to="/" className={`mixwarz-logo ${className}`} onClick={handleToggle}>
      <div className="logo-container" style={{ width }}>
        <div className="logo-content">
          <div className={`logo-mixer ${isToggled ? 'toggled' : ''}`}>
            <div className="mixer-body"></div>
            <div className="mixer-faders">
              <div className="fader"></div>
              <div className="fader"></div>
              <div className="fader"></div>
              <div className="fader"></div>
            </div>
            <div className="mixer-display"></div>
          </div>
        </div>
        <div className="logo-text">MIXWARZ</div>
      </div>
    </Link>
  );
};

export default Logo; 