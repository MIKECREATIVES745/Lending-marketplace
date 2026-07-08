import React, { useState, useEffect } from 'react';
import { complaintAPI } from '../utils/api';
import '../styles/complaints.css';

const Complaints = ({ currentUser }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'other',
    relatedGigId: '',
    relatedLoanId: '',
    relatedUserId: ''
  });

  const categories = [
    { value: 'gig-dispute', label: '🎯 Gig Dispute' },
    { value: 'loan-issue', label: '💰 Loan Issue' },
    { value: 'payment-problem', label: '💳 Payment Problem' },
    { value: 'user-conduct', label: '👤 User Conduct' },
    { value: 'platform-bug', label: '🐛 Platform Bug' },
    { value: 'other', label: '❓ Other' }
  ];

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintAPI.getMyComplaints();
      setComplaints(res.data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setMessage('Failed to load complaints');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!formData.subject.trim() || !formData.description.trim()) {
      setMessage('❌ Please fill in subject and description');
      return;
    }

    try {
      setLoading(true);
      const response = await complaintAPI.submitComplaint(formData);
      setMessage('✅ Complaint submitted successfully!');
      setFormData({
        subject: '',
        description: '',
        category: 'other',
        relatedGigId: '',
        relatedLoanId: '',
        relatedUserId: ''
      });
      setShowForm(false);
      fetchComplaints();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage('❌ Failed to submit complaint: ' + errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleDelete = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    
    try {
      await complaintAPI.deleteComplaint(complaintId);
      setMessage('✅ Complaint deleted successfully');
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage('❌ Failed to delete: ' + errorMsg);
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#f59e0b';
      case 'in-review': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return '🔴 Urgent';
      case 'high': return '🟠 High';
      case 'medium': return '🟡 Medium';
      case 'low': return '🟢 Low';
      default: return '⚪ Normal';
    }
  };

  return (
    <div className="container complaints-page">
      <div className="card complaints-header">
        <div className="header-content">
          <h2>📋 Support & Complaints</h2>
          <p>Submit issues or concerns about your experience on Smart Money</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ New Complaint'}
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="card complaint-form-card">
          <h3>Submit a Complaint</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Subject *</label>
              <input 
                type="text"
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                maxLength="100"
                required
              />
              <small>{formData.subject.length}/100</small>
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea 
                placeholder="Please provide detailed information about your complaint..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="6"
                maxLength="2000"
                required
              />
              <small>{formData.description.length}/2000</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Related Gig ID (if applicable)</label>
                <input 
                  type="text"
                  placeholder="Gig ID"
                  value={formData.relatedGigId}
                  onChange={(e) => setFormData({...formData, relatedGigId: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Related Loan ID (if applicable)</label>
                <input 
                  type="text"
                  placeholder="Loan ID"
                  value={formData.relatedLoanId}
                  onChange={(e) => setFormData({...formData, relatedLoanId: e.target.value})}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="complaints-list">
        <h3>Your Complaints ({complaints.length})</h3>
        
        {loading && !showForm ? (
          <div className="loading">Loading complaints...</div>
        ) : complaints.length > 0 ? (
          <div className="complaints-grid">
            {complaints.map(complaint => (
              <div 
                key={complaint._id} 
                className="complaint-item card"
                onClick={() => setSelectedComplaint(complaint)}
              >
                <div className="complaint-header">
                  <div>
                    <h4>{complaint.subject}</h4>
                    <span className="category-badge">
                      {categories.find(c => c.value === complaint.category)?.label}
                    </span>
                  </div>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(complaint.status) }}
                  >
                    {complaint.status}
                  </span>
                </div>
                
                <p className="complaint-description">
                  {complaint.description.substring(0, 100)}...
                </p>

                <div className="complaint-meta">
                  <span>{getPriorityBadge(complaint.priority)}</span>
                  <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No complaints yet. We hope everything is going well!</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Report an Issue
            </button>
          </div>
        )}
      </div>

      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedComplaint.subject}</h2>
                <p className="text-muted">Submitted on {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
              </div>
              <button 
                className="close-btn"
                onClick={() => setSelectedComplaint(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="label">Status:</span>
                <span 
                  className="value status"
                  style={{ backgroundColor: getStatusColor(selectedComplaint.status) }}
                >
                  {selectedComplaint.status}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Category:</span>
                <span className="value">
                  {categories.find(c => c.value === selectedComplaint.category)?.label}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Priority:</span>
                <span className="value">{getPriorityBadge(selectedComplaint.priority)}</span>
              </div>

              <div className="full-width">
                <h4>Description</h4>
                <p style={{ whiteSpace: 'pre-wrap', color: '#4b5563' }}>
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.adminNotes && (
                <div className="full-width admin-section">
                  <h4>Admin Notes</h4>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#4b5563' }}>
                    {selectedComplaint.adminNotes}
                  </p>
                </div>
              )}

              {selectedComplaint.resolution && (
                <div className="full-width resolution-section">
                  <h4>Resolution</h4>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#4b5563' }}>
                    {selectedComplaint.resolution}
                  </p>
                </div>
              )}

              {selectedComplaint.status === 'open' && (
                <div className="modal-actions">
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      handleDelete(selectedComplaint._id);
                    }}
                  >
                    Delete Complaint
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setSelectedComplaint(null)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
