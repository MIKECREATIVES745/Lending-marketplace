import React, { useState } from 'react';
import '../styles/navbar.css';

const Navbar = ({ currentUser, setCurrentPage }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-brand">
          <h1>💰 Creative Lending Store</h1>
        </div>
        
        {currentUser && (
          <div className="navbar-menu">
            <button className="notification-btn">
              🔔
              <span className="notification-badge">3</span>
            </button>
            <div className="user-menu">
              <button className="user-btn" onClick={() => setShowMenu(!showMenu)}>
                <span className="user-avatar">{currentUser.firstName?.charAt(0)}</span>
                <span>{currentUser.firstName}</span>
              </button>
              {showMenu && (
                <div className="dropdown-menu">
                      <button type="button" onClick={() => { setShowMenu(false); setCurrentPage('profile'); }}>👤 Profile</button>
                  <button type="button" onClick={() => { setShowMenu(false); setCurrentPage('settings'); }}>⚙️ Settings</button>
                  <button type="button" onClick={handleLogout}>🚪 Logout</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
