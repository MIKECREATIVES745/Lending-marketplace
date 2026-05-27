import React, { useState, useEffect } from 'react';
import '../styles/navbar.css';

const Navbar = ({ currentUser, setCurrentPage, notifications, onLogout, socket }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notificationList, setNotificationList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const userId = currentUser.id || currentUser._id;
    
    // Re-join room on socket reconnect or mount
    socket.emit('join-user-room', userId);
    
    const handleConnect = () => socket.emit('join-user-room', userId);
    socket.on('connect', handleConnect);

    const handleNewNotification = (notif) => {
      // Play instant notification sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play blocked by browser:', e));

      // Add to list (limit to 10 most recent)
      setNotificationList(prev => [notif, ...prev].slice(0, 10));
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification', handleNewNotification);
    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('connect', handleConnect);
    };
  }, [socket, currentUser]);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-brand">
          <h1 onClick={() => setCurrentPage('dashboard')} style={{ cursor: 'pointer' }}>💰 Smart Money</h1>
        </div>
        
        {currentUser && (
          <div className="navbar-menu">
            <div className="notification-wrapper" style={{ position: 'relative' }}>
              <button 
                className="notification-btn" 
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  setUnreadCount(0);
                }}
              >
              🔔
              {(unreadCount > 0 || notifications > 0) && <span className="notification-badge">{unreadCount || notifications}</span>}
            </button>

              {showNotifDropdown && (
                <div className="notification-dropdown" style={{ 
                  position: 'absolute', top: '100%', right: 0, width: '300px', zIndex: 1000,
                  maxHeight: '400px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  padding: '15px', backgroundColor: 'white', borderRadius: '16px', marginTop: '10px',
                  border: '1px solid #f3f4f6'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: '#111827' }}>Recent Notifications</h4>
                  {notificationList.length > 0 ? (
                    notificationList.map((n, i) => (
                      <div key={i} className="notification-item" style={{ padding: '10px', borderRadius: '10px', marginBottom: '5px', cursor: 'pointer', backgroundColor: '#f9fafb' }} onClick={() => {
                        if (n.gigId) setCurrentPage('gigs');
                        setShowNotifDropdown(false);
                      }}>
                        <strong style={{ display: 'block', fontSize: '13px' }}>{n.title}</strong>
                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{n.message}</p>
                        <small style={{ color: '#999', fontSize: '10px' }}>{new Date(n.timestamp || Date.now()).toLocaleTimeString()}</small>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>No recent notifications</p>
                  )}
                </div>
              )}
            </div>
            <div className="user-menu">
              <button className="user-btn" onClick={() => setShowMenu(!showMenu)}>
                <span className="user-avatar">{currentUser.firstName?.charAt(0)}</span>
                <span>{currentUser.firstName}</span>
              </button>
              {showMenu && (
                <div className="dropdown-menu">
                  <button type="button" onClick={() => { setShowMenu(false); setCurrentPage('profile'); }}>👤 Profile</button>
                  <button type="button" onClick={() => { setShowMenu(false); setCurrentPage('settings'); }}>⚙️ Settings</button>
                  <button type="button" onClick={onLogout}>🚪 Logout</button>
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
