import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import Loans from './components/Loans';
import GigBoard from './components/GigBoard';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Settings from './components/Settings';
import CollateralUpload from './components/CollateralUpload';
import LenderOffers from './components/LenderOffers';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';
import AdminDashboard from './components/AdminDashboard';
import BottomNav from './components/BottomNav';
import './styles/index.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [quickGigToApply, setQuickGigToApply] = useState(null);

  // Check if user is logged in and apply settings
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }

    // Apply Dark Mode from settings
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const { darkMode } = JSON.parse(savedSettings);
      if (darkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }

    setIsLoading(false);
  }, []);

  // Initialize Socket.io
  useEffect(() => {
    if (currentUser) {
      const newSocket = io(SOCKET_URL);

      newSocket.emit('join-user-room', currentUser._id || currentUser.id);

      newSocket.on('notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        // Simple visual feedback (e.g., alert or custom toast)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, { body: notification.message });
        } else {
          console.log('New Notification:', notification);
        }
      });

      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => newSocket.close();
    }
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPage(user?.isAdmin ? 'admin' : 'dashboard');
  };

  const handleAdminLoginPage = () => {
    setCurrentPage('admin-login');
  };

  const handleQuickGigApply = useCallback((gig) => {
    setQuickGigToApply(gig);
    setCurrentPage('gigs');
  }, []);

  const clearQuickGigToApply = useCallback(() => {
    setQuickGigToApply(null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setCurrentPage('dashboard');
    window.location.href = '/';
  };

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!currentUser) {
    return currentPage === 'admin-login' ? (
      <AdminLogin onLoginSuccess={handleLoginSuccess} onBack={() => setCurrentPage('dashboard')} />
    ) : (
      <Login onLoginSuccess={handleLoginSuccess} onAdminLogin={handleAdminLoginPage} />
    );
  }

  return (
    <div className="app">
      <Navbar
        currentUser={currentUser}
        setCurrentPage={setCurrentPage}
        notifications={notifications.length}
        onLogout={handleLogout}
      />
      
      <main className="main-content">
        {notifications.length > 0 && (
          <div className="notification-banner" onClick={() => setNotifications([])}>
            You have {notifications.length} new notification{notifications.length > 1 ? 's' : ''}. Tap to clear.
          </div>
        )}
        {currentPage === 'dashboard' && (
          <Dashboard
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
            onQuickGigApply={handleQuickGigApply}
          />
        )}
        {currentPage === 'marketplace' && <Marketplace currentUser={currentUser} setCurrentPage={setCurrentPage} />}
        {currentPage === 'loans' && <Loans currentUser={currentUser} />}
        {currentPage === 'gigs' && (
          <GigBoard
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
            initialGigToApply={quickGigToApply}
            clearInitialGigToApply={clearQuickGigToApply}
          />
        )}
        {currentPage === 'lending' && ['lender', 'both'].includes(currentUser?.userType) && (
          <LenderOffers currentUser={currentUser} />
        )}
        {currentPage === 'lending' && !['lender', 'both'].includes(currentUser?.userType) && (
          <div className="card">
            <h3>Lender Features Only</h3>
            <p className="text-muted">This section is only available for lenders.</p>
          </div>
        )}
        {currentPage === 'collateral' && ['borrower', 'both'].includes(currentUser?.userType) && (
          <CollateralUpload currentUser={currentUser} />
        )}
        {currentPage === 'collateral' && !['borrower', 'both'].includes(currentUser?.userType) && (
          <div className="card">
            <h3>Borrower Features Only</h3>
            <p className="text-muted">Collateral uploads are only for borrowers. As a lender, you can post lending offers instead.</p>
          </div>
        )}
        {currentPage === 'chat' && <Chat currentUser={currentUser} />}
        {currentPage === 'profile' && (
          <Profile
            currentUser={currentUser}
            onProfileUpdate={(updatedUser) => {
              setCurrentUser(updatedUser);
            }}
          />
        )}
        {currentPage === 'settings' && (
          <Settings
            currentUser={currentUser}
            onSettingsUpdate={() => {
              // Re-apply dark mode when settings change
              const savedSettings = localStorage.getItem('appSettings');
              if (savedSettings) {
                const { darkMode } = JSON.parse(savedSettings);
                if (darkMode) {
                  document.body.classList.add('dark-mode');
                } else {
                  document.body.classList.remove('dark-mode');
                }
              }
            }}
          />
        )}
        {currentPage === 'admin' && currentUser?.isAdmin && <AdminDashboard />}
        {currentPage === 'admin' && !currentUser?.isAdmin && (
          <div className="card">
            <h3>Unauthorized</h3>
            <p className="text-muted">You do not have permission to view this page.</p>
          </div>
        )}
        {currentPage === 'privacy' && <PrivacyPolicy setCurrentPage={setCurrentPage} />}
        {currentPage === 'terms' && <TermsConditions setCurrentPage={setCurrentPage} />}
      </main>

      <BottomNav
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <footer className="app-footer">
        <div className="container footer-content">
          <div className="footer-links">
            <button className="btn-link" onClick={() => setCurrentPage('terms')}>Terms & Conditions</button>
            <span className="divider">|</span>
            <button className="btn-link" onClick={() => setCurrentPage('privacy')}>Privacy Policy</button>
          </div>
          <div className="footer-contact">
            <div className="footer-item">
              <span className="footer-icon">📱</span>
              <span>WhatsApp</span>
              <a href="https://wa.me/260975132507" target="_blank" rel="noreferrer">0975132507</a>
            </div>
            <div className="footer-item">
              <span className="footer-icon">📸</span>
              <span>Instagram</span>
              <a href="https://instagram.com/mikecreatives" target="_blank" rel="noreferrer">@mikecreatives</a>
            </div>
            <div className="footer-item">
              <span className="footer-icon">✉️</span>
              <span>Email</span>
              <a href="mailto:mikecreatives745@gmail.com">mikecreatives745@gmail.com</a>
            </div>
          </div>
          <div className="footer-contact footer-contact-secondary">
            <div className="footer-item">
              <span className="footer-icon">📞</span>
              <span>Contact</span>
              <span>260975132507 / 260950949276</span>
            </div>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Smart Money · Mikecreatives Inc · Built by Mikec</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
