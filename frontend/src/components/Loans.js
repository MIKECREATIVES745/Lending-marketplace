import React, { useState, useEffect, useCallback } from 'react';
import { loanAPI } from '../utils/api';
import QRCodeComponent from './QRCode';
import '../styles/dashboard.css'; // Reusing dashboard styles for consistency

const Loans = ({ currentUser }) => {
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const userId = currentUser?.id || currentUser?._id;

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

  return (
    <div className="loans-page container">
      <h2>My Loans</h2>
      <p className="mb-4">Track your active loans and manage in-person exchanges.</p>

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
        <div className="loans-list">
          {loans.length > 0 ? loans.map(loan => (
            <div key={loan._id} className="card loan-item mb-3">
              <div className="loan-header">
                <div>
                  <h4>{loan.purpose || 'UNZA Student Loan'}</h4>
                  <p className="loan-amount">ZMW {loan.amount.toFixed(2)}</p>
                  <span className={`badge badge-${loan.status === 'active' ? 'success' : 'warning'}`}>
                    {loan.status.toUpperCase()}
                  </span>
                </div>
                <div className="loan-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => setSelectedLoanId(loan._id)}
                  >
                    Manage & QR
                  </button>
                </div>
              </div>
              <div className="loan-details mt-2">
                <p>📅 Term: {loan.loanTerm} Days</p>
                <p>📈 Interest: {loan.interestRate}%</p>
                <p>🤝 Role: {loan.borrowerId?._id === userId ? 'Borrower' : 'Lender'}</p>
              </div>
            </div>
          )) : (
            <div className="card text-center p-5">
              <p>You don't have any active loans yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Loans;
