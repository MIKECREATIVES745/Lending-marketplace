import React, { useState } from 'react';
import { userAPI } from '../utils/api';
import '../styles/auth.css';

const ForgotPassword = ({ onBack, onResetInitiated }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await userAPI.forgotPassword({ email });
      setMessage('✓ Check your email for a reset code. It will expire in 15 minutes.');
      // Move to reset password screen
      setTimeout(() => {
        onResetInitiated(email);
      }, 2000);
    } catch (err) {
      setMessage('If an account exists with this email, a reset link has been sent.');
      // For security, we show same message whether email exists or not
      // But still move to reset screen after a delay
      setTimeout(() => {
        onResetInitiated(email);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <button
          type="button"
          className="btn-link back-button"
          onClick={onBack}
        >
          ← Back to Login
        </button>

        <div className="form-header">
          <h2>Forgot Password?</h2>
          <p>No worries! Enter your email and we'll send you a reset code.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Remember your password? <button className="btn-link" onClick={onBack}>Login here</button></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
