import React, { useState, useEffect, useCallback } from 'react';
import { marketplaceAPI, loanAPI } from '../utils/api';
import '../styles/marketplace.css';

const Marketplace = ({ currentUser }) => {
  const [loans, setLoans] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    interestRate: ''
  });
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    amount: '',
    purpose: '',
    loanTerm: 30,
    interestRate: 8.5,
    collateralValue: ''
  });
  const [myLoans, setMyLoans] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const userType = currentUser?.userType || 'both';
  const userId = currentUser?.id || currentUser?._id;

  const fetchLoans = useCallback(async () => {
    try {
      const res = await marketplaceAPI.getAvailableLoans(filters);
      setLoans(res.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  }, [filters]);

  const fetchLenders = useCallback(async () => {
    try {
      const res = await marketplaceAPI.getAvailableLenders();
      setLenders(res.data);
    } catch (error) {
      console.error('Error fetching lenders:', error);
    }
  }, []);

  const fetchMyLoans = useCallback(async () => {
    try {
      const res = await loanAPI.getUserLoans(userId);
      setMyLoans(res.data);
    } catch (error) {
      console.error('Error fetching my loans:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'browse') {
      if (userType === 'borrower') {
        fetchLenders();
      } else {
        fetchLoans();
      }
    } else if (activeTab === 'myloans') {
      fetchMyLoans();
    }
  }, [activeTab, fetchLoans, fetchLenders, fetchMyLoans, userType]);

  const handleRequestLoan = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      await loanAPI.createLoan({
        amount: parseFloat(requestFormData.amount),
        purpose: requestFormData.purpose,
        loanTerm: parseInt(requestFormData.loanTerm),
        interestRate: parseFloat(requestFormData.interestRate),
        collateralValue: parseFloat(requestFormData.collateralValue)
      });
      
      setMessage('✅ Loan request created successfully!');
      setShowRequestForm(false);
      setRequestFormData({
        amount: '',
        purpose: '',
        loanTerm: 30,
        interestRate: 8.5,
        collateralValue: ''
      });
      setTimeout(() => setMessage(''), 3000);
      fetchMyLoans();
    } catch (error) {
      setMessage('❌ Error creating loan request: ' + error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="marketplace">
      <div className="container">
        <h2>💼 Marketplace</h2>
        
        {/* Role indicator */}
        <div className="role-indicator">
          <span className="role-badge">
            {userType === 'borrower' ? '📊 Borrower' : userType === 'lender' ? '💸 Lender' : '🔄 Both'}
          </span>
        </div>

        {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}
        
        {/* Tabs - Different for Borrower vs Lender */}
        <div className="marketplace-tabs">
          {userType !== 'borrower' && (
            <button 
              className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              📋 Available Loans to Fund
            </button>
          )}
          {userType !== 'lender' && (
            <button 
              className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              👥 Find Lenders
            </button>
          )}
          <button 
            className={`tab ${activeTab === 'myloans' ? 'active' : ''}`}
            onClick={() => setActiveTab('myloans')}
          >
            📊 My Loans ({myLoans.length})
          </button>
          {userType !== 'lender' && (
            <button 
              className={`tab ${activeTab === 'request' ? 'active' : ''}`}
              onClick={() => setActiveTab('request')}
            >
              ➕ Request Loan
            </button>
          )}
        </div>

        {/* Browse Loans Section - For Lenders */}
        {activeTab === 'browse' && userType !== 'borrower' && (
          <div className="loans-section">
            {/* Filters */}
            <div className="filters-card card">
              <h3>Filter Loans</h3>
              <div className="filter-grid">
                <div>
                  <label>Minimum Amount</label>
                  <input 
                    type="number" 
                    placeholder="Min amount"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                  />
                </div>
                <div>
                  <label>Maximum Amount</label>
                  <input 
                    type="number" 
                    placeholder="Max amount"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                  />
                </div>
                <div>
                  <label>Maximum Interest Rate</label>
                  <input 
                    type="number" 
                    placeholder="Interest rate"
                    value={filters.interestRate}
                    onChange={(e) => setFilters({...filters, interestRate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Available Loans */}
            <div className="loans-grid">
              {loans.length > 0 ? loans.map(loan => (
                <div key={loan._id} className="card loan-card-market">
                  <div className="loan-status">
                    <h4>{loan.purpose || 'Loan Request'}</h4>
                    <span className="badge badge-success">Pending</span>
                  </div>
                  
                  <div className="loan-amount-market">
                    <p className="label">Amount Needed</p>
                    <p className="amount">ZMW {loan.amount.toFixed(2)}</p>
                  </div>
                  
                  <div className="loan-terms">
                    <div>
                      <p className="label">Interest Rate</p>
                      <p className="value">{loan.interestRate}% APR</p>
                    </div>
                    <div>
                      <p className="label">Term</p>
                      <p className="value">{loan.loanTerm} Days</p>
                    </div>
                  </div>
                  
                  <div className="loan-collateral">
                    <p className="label">💰 Collateral Value</p>
                    <p>ZMW {loan.collateralValue.toFixed(2)}</p>
                  </div>
                  
                  <div className="borrower-info">
                    <p className="label">Borrower</p>
                    <p>{loan.borrowerId?.firstName} {loan.borrowerId?.lastName}</p>
                    <small>Credit Score: {loan.borrowerId?.creditScore}</small>
                  </div>
                  
                  <button className="btn btn-primary btn-block">Fund This Loan</button>
                </div>
              )) : <div className="card text-center p-3"><p>No loans available to fund</p></div>}
            </div>
          </div>
        )}

        {/* Browse Lenders Section - For Borrowers */}
        {activeTab === 'browse' && userType !== 'lender' && (
          <div className="lenders-section">
            <p className="section-info">Browse verified lenders and connect with them to fund your loan request.</p>
            <div className="lenders-grid">
              {lenders.length > 0 ? lenders.map(lender => (
                <div key={lender._id} className="card lender-card">
                  <div className="lender-header">
                    <div className="lender-avatar">
                      {lender.firstName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4>{lender.firstName} {lender.lastName}</h4>
                      <p className="verified">✓ Verified Lender</p>
                    </div>
                  </div>
                  
                  <div className="lender-stats">
                    <div className="stat">
                      <p className="label">Credit Score</p>
                      <p className="value">{lender.creditScore || 'N/A'}</p>
                    </div>
                    <div className="stat">
                      <p className="label">Total Lent</p>
                      <p className="value">ZMW {(lender.totalLent || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="lender-bio">
                    <p>📍 {lender.address?.city || 'City'}, {lender.address?.country || 'Country'}</p>
                  </div>
                  
                  <button className="btn btn-secondary btn-block">Message Lender</button>
                </div>
              )) : <div className="card text-center p-3"><p>No lenders available</p></div>}
            </div>
          </div>
        )}

        {/* My Loans Section */}
        {activeTab === 'myloans' && (
          <div className="myloans-section">
            {myLoans.length > 0 ? (
              <div className="loans-list">
                {myLoans.map(loan => (
                  <div key={loan._id} className="card loan-item mb-2">
                    <div className="loan-header">
                      <div>
                        <h4>{loan.purpose || 'UNZA Student Loan'}</h4>
                        <p className="loan-amount">ZMW {loan.amount.toFixed(2)}</p>
                        <span className={`badge badge-${loan.status === 'active' ? 'success' : 'warning'}`}>
                          {loan.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                      <div className="loan-details-side">
                        <p>📅 {loan.loanTerm} Days</p>
                        <p>📈 {loan.interestRate}% Interest</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center p-5">
                <p className="text-muted">You don't have any loans yet.</p>
                {userType !== 'lender' && (
                  <button className="btn btn-primary mt-3" onClick={() => setActiveTab('request')}>
                    Request Your First Loan
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Request Loan Section - For Borrowers */}
        {activeTab === 'request' && userType !== 'lender' && (
          <div className="request-loan-section">
            {!showRequestForm ? (
              <div className="card text-center p-5">
                <h3>Request a Loan</h3>
                <p className="text-muted mb-4">Create a new loan request to find lenders</p>
                <button className="btn btn-primary btn-lg" onClick={() => setShowRequestForm(true)}>
                  ➕ New Loan Request
                </button>
              </div>
            ) : (
              <div className="card request-form-card">
                <div className="form-header">
                  <h3>Create Loan Request</h3>
                  <button className="btn-close" onClick={() => setShowRequestForm(false)}>✕</button>
                </div>
                
                <form onSubmit={handleRequestLoan}>
                  <div className="form-group">
                    <label>Loan Amount (ZMW)</label>
                    <input 
                      type="number" 
                      placeholder="e.g., 5000"
                      value={requestFormData.amount}
                      onChange={(e) => setRequestFormData({...requestFormData, amount: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Purpose</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Tuition, Educational Materials, etc."
                      value={requestFormData.purpose}
                      onChange={(e) => setRequestFormData({...requestFormData, purpose: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Loan Term (Days)</label>
                      <input 
                        type="number" 
                        placeholder="e.g., 30"
                        value={requestFormData.loanTerm}
                        onChange={(e) => setRequestFormData({...requestFormData, loanTerm: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Interest Rate (% APR)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="e.g., 8.5"
                        value={requestFormData.interestRate}
                        onChange={(e) => setRequestFormData({...requestFormData, interestRate: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Collateral Value (ZMW)</label>
                    <input 
                      type="number" 
                      placeholder="e.g., 3000"
                      value={requestFormData.collateralValue}
                      onChange={(e) => setRequestFormData({...requestFormData, collateralValue: e.target.value})}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                    {isLoading ? 'Creating...' : '✅ Create Loan Request'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
