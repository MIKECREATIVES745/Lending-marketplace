import React, { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';
import '../styles/auth.css';

const Profile = ({ currentUser, onProfileUpdate }) => {
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    programOfStudy: '',
    computerNumber: '',
    userType: 'both'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const userId = currentUser?.id || currentUser?._id;

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await userAPI.getProfile(userId);
        setFormState({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          programOfStudy: res.data.programOfStudy || '',
          computerNumber: res.data.computerNumber || '',
          userType: res.data.userType || 'both'
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await userAPI.updateProfile(userId, {
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        phone: formState.phone,
        programOfStudy: formState.programOfStudy,
        computerNumber: formState.computerNumber,
        userType: formState.userType
      });
      onProfileUpdate({
        ...currentUser,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        email: res.data.email,
        phone: res.data.phone,
        programOfStudy: res.data.programOfStudy,
        computerNumber: res.data.computerNumber,
        userType: res.data.userType
      });
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        email: res.data.email,
        phone: res.data.phone,
        programOfStudy: res.data.programOfStudy,
        computerNumber: res.data.computerNumber,
        userType: res.data.userType
      }));
      setMessage('✅ Profile saved successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('❌ Unable to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container"><p>Loading profile...</p></div>;
  }

  return (
    <div className="container profile-page">
      <div className="card profile-card">
        <h2>My Student Profile</h2>
        <p className="profile-subtitle">Student details for UNZA and Zambian university users.</p>

        <form onSubmit={handleSave} className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formState.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formState.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formState.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Program of Study</label>
              <input
                type="text"
                name="programOfStudy"
                value={formState.programOfStudy}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Computer Number</label>
              <input
                type="text"
                name="computerNumber"
                value={formState.computerNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Account Type</label>
              <select
                name="userType"
                value={formState.userType}
                onChange={handleChange}
              >
                <option value="both">Both (Borrower & Lender)</option>
                <option value="borrower">Borrower Only</option>
                <option value="lender">Lender Only</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Profile'}
          </button>

          {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default Profile;
