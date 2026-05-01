import React, { useState, useEffect } from 'react';
import { marketplaceAPI } from '../utils/api';
import '../styles/marketplace.css';

const Marketplace = ({ currentUser }) => {
  const [loans, setLoans] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [activeTab, setActiveTab] = useState('loans');
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    interestRate: ''
  });

  useEffect(() => {
    if (activeTab === 'loans') {
      fetchLoans();
    } else {
      fetchLenders();
    }
  }, [activeTab, filters]);

  const fetchLoans = async () => {
    try {
      const res = await marketplaceAPI.getAvailableLoans(filters);
      setLoans(res.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const fetchLenders = async () => {
    try {
      const res = await marketplaceAPI.getAvailableLenders();
      setLenders(res.data);
    } catch (error) {
      console.error('Error fetching lenders:', error);
    }
  };

  return (
    <div className="marketplace">
      <div className="container">
        <h2>Marketplace</h2>
        
        {/* Tabs */}
        <div className="marketplace-tabs">
          <button 
            className={`tab ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            📋 Available Loans to Fund
          </button>
          <button 
            className={`tab ${activeTab === 'lenders' ? 'active' : ''}`}
            onClick={() => setActiveTab('lenders')}
          >
            👥 Find Lenders
          </button>
        </div>

        {activeTab === 'loans' && (
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
                  <label>Minimum Interest Rate</label>
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
              {loans.map(loan => (
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
              ))}
            </div>
          </div>
        )}

        {activeTab === 'lenders' && (
          <div className="lenders-section">
            <div className="lenders-grid">
              {lenders.map(lender => (
                <div key={lender._id} className="card lender-card">
                  <div className="lender-header">
                    <div className="lender-avatar">
                      {lender.firstName?.charAt(0)}
                    </div>
                    <div>
                      <h4>{lender.firstName} {lender.lastName}</h4>
                      <p className="verified">✓ Verified Lender</p>
                    </div>
                  </div>
                  
                  <div className="lender-stats">
                    <div className="stat">
                      <p className="label">Credit Score</p>
                      <p className="value">{lender.creditScore}</p>
                    </div>
                    <div className="stat">
                      <p className="label">Total Lent</p>
                      <p className="value">${lender.totalLent.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="lender-bio">
                    <p>{lender.address?.city}, {lender.address?.country}</p>
                  </div>
                  
                  <button className="btn btn-secondary btn-block">Message Lender</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
