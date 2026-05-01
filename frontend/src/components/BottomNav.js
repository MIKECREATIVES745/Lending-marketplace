import React from 'react';
import '../styles/bottom-nav.css';

const BottomNav = ({ currentPage, setCurrentPage }) => {
  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
        onClick={() => setCurrentPage('dashboard')}
      >
        <span className="nav-icon">📊</span>
        <span className="nav-label">Dashboard</span>
      </button>
      <button 
        className={`nav-item ${currentPage === 'marketplace' ? 'active' : ''}`}
        onClick={() => setCurrentPage('marketplace')}
      >
        <span className="nav-icon">🏪</span>
        <span className="nav-label">Market</span>
      </button>
      <button 
        className={`nav-item ${currentPage === 'loans' ? 'active' : ''}`}
        onClick={() => setCurrentPage('loans')}
      >
        <span className="nav-icon">💰</span>
        <span className="nav-label">Loans</span>
      </button>
      <button 
        className={`nav-item ${currentPage === 'chat' ? 'active' : ''}`}
        onClick={() => setCurrentPage('chat')}
      >
        <span className="nav-icon">💬</span>
        <span className="nav-label">Messages</span>
      </button>
      <button 
        className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
        onClick={() => setCurrentPage('profile')}
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profile</span>
      </button>
      <button 
        className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
        onClick={() => setCurrentPage('settings')}
      >
        <span className="nav-icon">⚙️</span>
        <span className="nav-label">Settings</span>
      </button>
    </nav>
  );
};

export default BottomNav;
