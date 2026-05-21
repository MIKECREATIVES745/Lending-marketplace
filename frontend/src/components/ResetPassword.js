import React, { useState } from 'react';
import { userAPI } from '../utils/api';
import '../styles/auth.css';

const ResetPassword = ({ email, onBack, onResetSuccess }) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validatePassword = (password) => {
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!code || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (code.length !== 6) {
      setError('Reset code must be 6 digits');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.resetPassword({
        email,
        code,
        newPassword
      });

      setMessage('✓ Password reset successful!');
      // Redirect to login with success
      setTimeout(() => {
        onResetSuccess(response.data.user.email);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please check your code.');
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
          ← Back
        </button>

        <div className="form-header">
          <h2>Reset Password</h2>
          <p>Enter the 6-digit code sent to {email}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Reset Code (6 digits)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters, 1 uppercase, 1 number"
                disabled={loading}
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p style={{ fontSize: '12px', color: '#666' }}>
            Reset code expires in 15 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
