import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'both',
    phone: '',
    programOfStudy: '',
    computerNumber: ''
  });
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
      // Validate inputs
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      if (!isLogin && (!formData.firstName || !formData.lastName)) {
        setError('First name and last name are required');
        setLoading(false);
        return;
      }

      const response = isLogin
        ? await authAPI.login({ email: formData.email, password: formData.password })
        : await authAPI.register(formData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      console.error('Auth error:', errorMessage);
      
      // Provide helpful error messages
      if (errorMessage.includes('connect ECONNREFUSED') || errorMessage.includes('buffering timed out')) {
        setError('Server connection failed. Please make sure the backend is running.');
      } else if (errorMessage.includes('Invalid credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('User already exists')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💰 Creative Lending Store</h1>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
              <div className="form-group">
                <label>User Type</label>
                <select name="userType" value={formData.userType} onChange={handleChange}>
                  <option value="both">Both Lender & Borrower</option>
                  <option value="borrower">Borrower Only</option>
                  <option value="lender">Lender Only</option>
                </select>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
              <div className="form-group">
                <label>Program of Study</label>
                <input
                  type="text"
                  name="programOfStudy"
                  value={formData.programOfStudy}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
              <div className="form-group">
                <label>Computer Number</label>
                <input
                  type="text"
                  name="computerNumber"
                  value={formData.computerNumber}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              className="toggle-auth"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
