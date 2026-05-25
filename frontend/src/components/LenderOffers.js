import React, { useState, useEffect } from 'react';
import { lendingAPI } from '../utils/api';
import '../styles/lending.css';

const LenderOffers = ({ currentUser }) => {
  const [offers, setOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    lenderName: currentUser?.firstName + ' ' + currentUser?.lastName || '',
    amount: '',
    interestRate: '',
    loanTerm: '',
    description: '',
    lenderDetails: {
      businessName: '',
      businessType: '',
      yearsInBusiness: ''
    },
    terms: {
      acceptsCollateral: false,
      requiresCreditScore: '',
      requiresGuarantor: false
    }
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await lendingAPI.getMyOffers();
      setOffers(res.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setMessage('❌ Failed to load lending offers');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('lenderDetails.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        lenderDetails: { ...prev.lenderDetails, [key]: value }
      }));
    } else if (name.startsWith('terms.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        terms: {
          ...prev.terms,
          [key]: type === 'checkbox' ? checked : (key === 'requiresCreditScore' ? parseInt(value) : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validate required fields
    if (!formData.amount || !formData.interestRate || !formData.loanTerm) {
      setMessage('❌ Please fill in amount, interest rate, and loan term');
      return;
    }

    try {
      if (editingId) {
        await lendingAPI.updateLendingOffer(editingId, formData);
        setMessage('✅ Lending offer updated successfully!');
        setEditingId(null);
      } else {
        await lendingAPI.createLendingOffer(formData);
        setMessage('✅ Lending offer posted successfully!');
      }

      // Reset form
      setFormData({
        lenderName: currentUser?.firstName + ' ' + currentUser?.lastName || '',
        amount: '',
        interestRate: '',
        loanTerm: '',
        description: '',
        lenderDetails: { businessName: '', businessType: '', yearsInBusiness: '' },
        terms: { acceptsCollateral: false, requiresCreditScore: '', requiresGuarantor: false }
      });
      setShowForm(false);
      fetchOffers();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEdit = (offer) => {
    setFormData(offer);
    setEditingId(offer._id);
    setShowForm(true);
  };

  const handleDelete = async (offerId) => {
    if (window.confirm('Are you sure you want to delete this lending offer?')) {
      try {
        await lendingAPI.deleteLendingOffer(offerId);
        setMessage('✅ Lending offer deleted');
        fetchOffers();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(`❌ Error deleting offer: ${error.message}`);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      lenderName: currentUser?.firstName + ' ' + currentUser?.lastName || '',
      amount: '',
      interestRate: '',
      loanTerm: '',
      description: '',
      lenderDetails: { businessName: '', businessType: '', yearsInBusiness: '' },
      terms: { acceptsCollateral: false, requiresCreditScore: '', requiresGuarantor: false }
    });
  };

  return (
    <div className="lending-container">
      <div className="lending-header">
        <h1>💰 My Lending Offers</h1>
        <p>Post lending offers for borrowers to apply for</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {!showForm ? (
        <button className="btn btn-primary btn-lg" onClick={() => setShowForm(true)}>
          + Post New Lending Offer
        </button>
      ) : (
        <form className="lending-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label>Your Name *</label>
              <input
                type="text"
                name="lenderName"
                value={formData.lenderName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Lending Amount (K) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="e.g., 50000"
                  required
                  min="0"
                  step="1000"
                />
              </div>

              <div className="form-group">
                <label>Interest Rate (%) *</label>
                <input
                  type="number"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  placeholder="e.g., 15"
                  required
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>

              <div className="form-group">
                <label>Loan Term (Months) *</label>
                <input
                  type="number"
                  name="loanTerm"
                  value={formData.loanTerm}
                  onChange={handleInputChange}
                  placeholder="e.g., 12"
                  required
                  min="1"
                  step="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell borrowers about your lending terms and conditions..."
                rows="3"
                maxLength="500"
              />
              <small>{formData.description.length}/500</small>
            </div>
          </div>

          <div className="form-section">
            <h3>Lender Details (Optional)</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Business Name</label>
                <input
                  type="text"
                  name="lenderDetails.businessName"
                  value={formData.lenderDetails.businessName}
                  onChange={handleInputChange}
                  placeholder="e.g., Tech Finance Ltd"
                />
              </div>

              <div className="form-group">
                <label>Business Type</label>
                <input
                  type="text"
                  name="lenderDetails.businessType"
                  value={formData.lenderDetails.businessType}
                  onChange={handleInputChange}
                  placeholder="e.g., Licensed Lender"
                />
              </div>

              <div className="form-group">
                <label>Years in Business</label>
                <input
                  type="number"
                  name="lenderDetails.yearsInBusiness"
                  value={formData.lenderDetails.yearsInBusiness}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Terms & Requirements</h3>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="terms.acceptsCollateral"
                  checked={formData.terms.acceptsCollateral}
                  onChange={handleInputChange}
                />
                I accept collateral as security
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Credit Score Required</label>
                <input
                  type="number"
                  name="terms.requiresCreditScore"
                  value={formData.terms.requiresCreditScore}
                  onChange={handleInputChange}
                  placeholder="e.g., 300"
                  min="0"
                  max="1000"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="terms.requiresGuarantor"
                    checked={formData.terms.requiresGuarantor}
                    onChange={handleInputChange}
                  />
                  Require a guarantor
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Offer' : 'Post Offer'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="offers-grid">
        {offers.length === 0 ? (
          <p className="no-offers">No lending offers yet. Start by posting one!</p>
        ) : (
          offers.map(offer => (
            <div key={offer._id} className="offer-card">
              <div className="offer-header">
                <h3>{offer.lenderName}</h3>
                <span className={`status ${offer.status}`}>{offer.status}</span>
              </div>

              <div className="offer-amount">
                <strong>K{offer.amount.toLocaleString()}</strong>
              </div>

              <div className="offer-details">
                <p><strong>Interest Rate:</strong> {offer.interestRate}% p.a.</p>
                <p><strong>Loan Term:</strong> {offer.loanTerm} months</p>
                {offer.description && <p><strong>Description:</strong> {offer.description}</p>}
                {offer.lenderDetails?.businessName && (
                  <p><strong>Business:</strong> {offer.lenderDetails.businessName}</p>
                )}
              </div>

              <div className="offer-terms">
                {offer.terms?.acceptsCollateral && <span className="badge">✓ Accepts Collateral</span>}
                {offer.terms?.requiresGuarantor && <span className="badge">✓ Requires Guarantor</span>}
                {offer.terms?.requiresCreditScore && (
                  <span className="badge">Min Credit: {offer.terms.requiresCreditScore}</span>
                )}
              </div>

              <div className="offer-stats">
                <p>Applications: {offer.acceptedApplications?.length || 0}</p>
              </div>

              <div className="offer-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleEdit(offer)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(offer._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LenderOffers;
