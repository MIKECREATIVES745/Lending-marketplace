import React, { useEffect, useState } from 'react';
import '../styles/settings.css';

const defaultSettings = {
  notifications: true,
  emailReports: false,
  autoLogin: true,
  darkMode: false
};

const Settings = ({ currentUser, onSettingsUpdate }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const applyDarkModeCSS = (isDarkMode) => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const toggleOption = (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(newSettings);

    // Apply dark mode CSS immediately when toggling
    if (key === 'darkMode') {
      applyDarkModeCSS(newSettings.darkMode);
      // Save to localStorage immediately
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
    }
  };

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setMessage('Settings saved successfully.');
    if (onSettingsUpdate) onSettingsUpdate();
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="container settings-page">
      <div className="card settings-card">
        <h2>App Settings</h2>
        <p className="settings-subtitle">Manage the app behavior and notifications for your lending marketplace.</p>

        <div className="settings-list">
          <div className="settings-item">
            <div>
              <h3>Notifications</h3>
              <p>Receive app alerts about loan requests, payments, and updates.</p>
            </div>
            <button className={`btn ${settings.notifications ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleOption('notifications')}>
              {settings.notifications ? 'On' : 'Off'}
            </button>
          </div>

          <div className="settings-item">
            <div>
              <h3>Email Reports</h3>
              <p>Get monthly summary reports sent to your email.</p>
            </div>
            <button className={`btn ${settings.emailReports ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleOption('emailReports')}>
              {settings.emailReports ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="settings-item">
            <div>
              <h3>Auto Login</h3>
              <p>Keep you signed in on this device for faster access.</p>
            </div>
            <button className={`btn ${settings.autoLogin ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleOption('autoLogin')}>
              {settings.autoLogin ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="settings-item">
            <div>
              <h3>Dark Mode</h3>
              <p>Toggle a darker color palette for the app.</p>
            </div>
            <button className={`btn ${settings.darkMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleOption('darkMode')}>
              {settings.darkMode ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={handleSave}>
          Save Settings
        </button>

        {message && <div className="success-message mt-2">{message}</div>}
      </div>
    </div>
  );
};

export default Settings;
