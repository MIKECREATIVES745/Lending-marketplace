import React, { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../utils/api';
import '../styles/index.css';

const statusOptions = ['', 'pending', 'active', 'completed', 'defaulted', 'cancelled'];

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    borrowerId: '',
    lenderId: '',
    status: ''
  });
  const [borrowers, setBorrowers] = useState([]);
  const [lenders, setLenders] = useState([]);

  const fetchAdminData = async (params = {}) => {
    setLoading(true);
    setError('');

    try {
      const [summaryRes, transactionsRes] = await Promise.all([
        adminAPI.getSummary(params),
        adminAPI.getTransactions(params)
      ]);
      setSummary(summaryRes.data);
      setTransactions(transactionsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [borrowersRes, lendersRes] = await Promise.all([
        userAPI.getBorrowers(),
        userAPI.getLenders()
      ]);
      setBorrowers(borrowersRes.data);
      setLenders(lendersRes.data);
    } catch (err) {
      console.error('Failed to load user lists:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAdminData();
  }, []);

  const applyFilters = () => {
    const params = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params[key] = filters[key];
      }
    });
    fetchAdminData(params);
  };

  const downloadCSV = () => {
    const csvRows = [];
    const headers = [
      'Loan ID',
      'Borrower',
      'Lender',
      'Amount',
      'Funding Fee',
      'Payment Fees',
      'Total Revenue',
      'Status',
      'Created At',
      'Funded At',
      'Expected Completion'
    ];
    csvRows.push(headers.join(','));

    transactions.forEach(tx => {
      csvRows.push([
        tx.loanId,
        tx.borrower,
        tx.lender,
        tx.amount.toFixed(2),
        tx.platformFeeAmount.toFixed(2),
        tx.paymentPlatformFeeTotal.toFixed(2),
        tx.platformRevenue.toFixed(2),
        tx.status,
        tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '',
        tx.fundedAt ? new Date(tx.fundedAt).toLocaleString() : '',
        tx.expectedCompletionDate ? new Date(tx.expectedCompletionDate).toLocaleString() : ''
      ].map(value => `"${value}"`).join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `admin-transactions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="loading-screen">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard container">
      <div className="card mb-4">
        <div className="section-heading">
          <h2>🛠️ Admin Dashboard</h2>
          <p className="text-muted">Track transactions, platform fees, payouts and exported reports.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card mb-4">
        <h3>Filters</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Borrower</label>
            <select
              value={filters.borrowerId}
              onChange={(e) => setFilters({ ...filters, borrowerId: e.target.value })}
            >
              <option value="">All borrowers</option>
              {borrowers.map((borrower) => (
                <option key={borrower._id} value={borrower._id}>
                  {borrower.firstName} {borrower.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Lender</label>
            <select
              value={filters.lenderId}
              onChange={(e) => setFilters({ ...filters, lenderId: e.target.value })}
            >
              <option value="">All lenders</option>
              {lenders.map((lender) => (
                <option key={lender._id} value={lender._id}>
                  {lender.firstName} {lender.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All statuses'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={applyFilters}>
            Apply Filters
          </button>
          <button className="btn btn-secondary" onClick={() => {
            setFilters({ startDate: '', endDate: '', borrowerId: '', lenderId: '', status: '' });
            fetchAdminData();
          }}>
            Clear Filters
          </button>
          <button className="btn btn-outline" onClick={downloadCSV}>
            Export Report
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid admin-summary-grid">
          <div className="card">
            <h3>Total Fees Collected</h3>
            <p className="amount">ZMW {summary.totalPlatformFees.toFixed(2)}</p>
          </div>
          <div className="card">
            <h3>Funded Loans</h3>
            <p className="amount">{summary.totalLoansFunded}</p>
          </div>
          <div className="card">
            <h3>Active Loans</h3>
            <p className="amount">{summary.totalActive}</p>
          </div>
          <div className="card">
            <h3>Completed Loans</h3>
            <p className="amount">{summary.totalCompleted}</p>
          </div>
        </div>
      )}

      <div className="card mt-4">
        <div className="section-heading">
          <h3>Recent Transactions</h3>
          <p className="text-muted">Latest loans and fee revenue details.</p>
        </div>

        {transactions.length === 0 ? (
          <p className="text-muted">No transactions found yet.</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Borrower</th>
                  <th>Lender</th>
                  <th>Amount</th>
                  <th>Funding Fee</th>
                  <th>Payment Fees</th>
                  <th>Total Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.loanId}</td>
                    <td>{tx.borrower}</td>
                    <td>{tx.lender}</td>
                    <td>ZMW {tx.amount.toFixed(2)}</td>
                    <td>ZMW {tx.platformFeeAmount.toFixed(2)}</td>
                    <td>ZMW {tx.paymentPlatformFeeTotal.toFixed(2)}</td>
                    <td>ZMW {tx.platformRevenue.toFixed(2)}</td>
                    <td>{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
