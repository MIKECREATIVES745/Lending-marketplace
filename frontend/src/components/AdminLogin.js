import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

const AdminLogin = ({ onLoginSuccess, onBack }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email: formData.email, password: formData.password });

      if (!response.data.user?.isAdmin) {
        setError('Access denied. Please use an admin account.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || !err.response) {
        setError('Server connection failed. Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.error || 'Failed to login as admin');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🛠️ Admin Login</h1>
          <p>Sign in with your admin credentials to manage the platform.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" className="btn-link" onClick={onBack}>
            Back to user login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
