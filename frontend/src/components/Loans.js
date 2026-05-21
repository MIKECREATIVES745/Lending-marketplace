import React, { useState, useEffect, useCallback } from 'react';
import { loanAPI } from '../utils/api';
import QRCodeComponent from './QRCode';
import '../styles/dashboard.css'; // Reusing dashboard styles for consistency

const Loans = ({ currentUser }) => {
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const userId = currentUser?.id || currentUser?._id;
  const userType = currentUser?.userType || 'both';

  const fetchLoans = useCallback(async () => {
    try {
      const res = await loanAPI.getUserLoans(userId);
      setLoans(res.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchLoans();
    }
  }, [userId, fetchLoans]);

  const filteredLoans = filterStatus === 'all' 
    ? loans 
    : loans.filter(loan => loan.status === filterStatus);

  return (
    <div className="loans-page container">
      <div className="loans-page-header">
        <h2>💰 My Loans</h2>
        <p className="subtitle">Track your active loans and manage in-person exchanges.</p>
      </div>

      {selectedLoanId ? (
        <div className="manage-loan-view">
          <button
            className="btn btn-outline mb-3"
            onClick={() => setSelectedLoanId(null)}
          >
            ← Back to Loans
          </button>
          <QRCodeComponent loanId={selectedLoanId} currentUser={currentUser} />
        </div>
      ) : (
        <>
          {/* Status Filter */}
          <div className="status-filter mb-4">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({loans.length})
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Pending ({loans.filter(l => l.status === 'pending').length})
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Active ({loans.filter(l => l.status === 'active').length})
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              Completed ({loans.filter(l => l.status === 'completed').length})
            </button>
          </div>

          {filteredLoans.length > 0 ? (
            <div className="loans-list">
              {filteredLoans.map(loan => (
                <div key={loan._id} className="card loan-item mb-3">
                  <div className="loan-header">
                    <div className="loan-main-info">
                      <h4>{loan.purpose || 'UNZA Student Loan'}</h4>
                      <p className="loan-amount">ZMW {loan.amount.toFixed(2)}</p>
                      <span className={`badge badge-${loan.status === 'active' ? 'success' : loan.status === 'pending' ? 'warning' : 'info'}`}>
                        {loan.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <div className="loan-side-info">
                      <div className="info-block">
                        <span className="label">Term</span>
                        <span className="value">{loan.loanTerm} Days</span>
                      </div>
                      <div className="info-block">
                        <span className="label">Interest</span>
                        <span className="value">{loan.interestRate}%</span>
                      </div>
                      <div className="info-block">
                        <span className="label">Role</span>
                        <span className="value">{loan.borrowerId?._id === userId ? '📊 Borrower' : '💸 Lender'}</span>
                      </div>
                    </div>
                    <div className="loan-actions">
                      {loan.status === 'active' && (
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => setSelectedLoanId(loan._id)}
                        >
                          Manage & QR
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="loan-details mt-2">
                    <div className="detail-item">
                      <span className="label">Borrower:</span>
                      <span className="value">{loan.borrowerId?.firstName} {loan.borrowerId?.lastName}</span>
                    </div>
                    {loan.lenderId && (
                      <div className="detail-item">
                        <span className="label">Lender:</span>
                        <span className="value">{loan.lenderId?.firstName} {loan.lenderId?.lastName}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="label">Collateral:</span>
                      <span className="value">ZMW {loan.collateralValue?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center p-5">
              <p className="text-muted mb-3">
                {filterStatus === 'all' 
                  ? "You don't have any active loans yet." 
                  : `No ${filterStatus} loans found.`}
              </p>
              {userType !== 'lender' && (
                <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
                  ➕ Request a Loan
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Loans;
