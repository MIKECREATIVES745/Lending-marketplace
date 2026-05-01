import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import './styles/index.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <Navbar currentUser={currentUser} setCurrentPage={setCurrentPage} />
      
      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard currentUser={currentUser} />}
        {currentPage === 'marketplace' && <Marketplace currentUser={currentUser} />}
        {currentPage === 'loans' && <Dashboard currentUser={currentUser} />}
        {currentPage === 'chat' && <Chat currentUser={currentUser} />}
        {currentPage === 'profile' && (
          <Profile
            currentUser={currentUser}
            onProfileUpdate={(updatedUser) => {
              setCurrentUser(updatedUser);
            }}
          />
        )}
        {currentPage === 'settings' && <Settings currentUser={currentUser} />}
      </main>

      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <footer className="app-footer">
        <div className="container footer-content">
          <p>Contact: <a href="mailto:contact@mikecreatives.inc">contact@mikecreatives.inc</a></p>
          <p>Mikecreatives Inc · Built by Mikec</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
