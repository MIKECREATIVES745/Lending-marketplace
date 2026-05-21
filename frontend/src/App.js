import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import Loans from './components/Loans';
import GigBoard from './components/GigBoard';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Settings from './components/Settings';
import CollateralUpload from './components/CollateralUpload';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';
import BottomNav from './components/BottomNav';
import './styles/index.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

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
      setSocket(newSocket);

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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    window.location.href = '/';
  };

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
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
          />
        )}
        {currentPage === 'marketplace' && <Marketplace currentUser={currentUser} />}
        {currentPage === 'loans' && <Loans currentUser={currentUser} />}
        {currentPage === 'gigs' && <GigBoard currentUser={currentUser} setCurrentPage={setCurrentPage} />}
        {currentPage === 'collateral' && <CollateralUpload currentUser={currentUser} />}
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
        {currentPage === 'privacy' && <PrivacyPolicy setCurrentPage={setCurrentPage} />}
        {currentPage === 'terms' && <TermsConditions setCurrentPage={setCurrentPage} />}
      </main>

      <BottomNav
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />

      <footer className="app-footer">
        <div className="container footer-content">
          <div className="footer-links">
            <button className="btn-link" onClick={() => setCurrentPage('terms')}>Terms & Conditions</button>
            <span className="divider">|</span>
            <button className="btn-link" onClick={() => setCurrentPage('privacy')}>Privacy Policy</button>
          </div>
          <p>Contact: <a href="mailto:contact@mikecreatives.inc">contact@mikecreatives.inc</a></p>
          <p>© {new Date().getFullYear()} Smart Money · Mikecreatives Inc · Built by Mikec</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
