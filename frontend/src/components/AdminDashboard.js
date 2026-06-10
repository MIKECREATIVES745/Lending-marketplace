import React, { useState, useEffect } from 'react';
import { adminAPI, userAPI, gigAPI } from '../utils/api'; // Added gigAPI
import { 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
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
  const [message, setMessage] = useState(''); // For success/error messages
  const [pendingGigApplications, setPendingGigApplications] = useState([]);
  const [pendingBcLoans, setPendingBcLoans] = useState([]);
  const [bcLoanActionLoading, setBcLoanActionLoading] = useState(false); // New loading state for BC loans
  const [gigActionLoading, setGigActionLoading] = useState(false);

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

  const fetchPendingGigApplications = async () => {
    try {
      const res = await gigAPI.getAdminGigApplications(); // Assuming gigAPI has this method
      setPendingGigApplications(res.data);
    } catch (err) {
      console.error('Failed to load pending gig applications:', err);
    }
  };

  const fetchBcApplications = async () => {
    try {
      const res = await adminAPI.getBcApplications();
      setPendingBcLoans(res.data);
    } catch (err) {
      console.error('Failed to load BC applications:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAdminData();
    fetchPendingGigApplications();
    fetchBcApplications();
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

  const handleHireWorkerAdmin = async (gigId, workerId) => {
    setMessage('');
    if (!window.confirm('Are you sure you want to hire this worker for the gig? This action cannot be undone.')) return;
    setGigActionLoading(true);
    try {
      await gigAPI.hireWorker(gigId, workerId);
      setMessage('✅ Worker hired successfully! Gig status updated.');
      fetchPendingGigApplications();
      fetchAdminData();
    } catch (error) {
      setMessage('❌ Failed to hire worker: ' + (error.response?.data?.error || error.message));
    } finally {
      setGigActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeclineApplicantAdmin = async (gigId, applicantId) => {
    setMessage('');
    if (!window.confirm('Are you sure you want to decline this applicant? This action cannot be undone.')) return;
    setGigActionLoading(true);
    try {
      await gigAPI.declineApplication(gigId, applicantId);
      setMessage('✅ Applicant declined successfully!');
      fetchPendingGigApplications();
      fetchAdminData();
    } catch (error) {
      setMessage('❌ Failed to decline applicant: ' + (error.response?.data?.error || error.message));
    } finally {
      setGigActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const prepareChartData = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const dailyStats = transactions.reduce((acc, tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!acc[date]) acc[date] = { name: date, Volume: 0, Revenue: 0 };
      acc[date].Volume += (tx.amount || 0);
      acc[date].Revenue += (tx.platformRevenue || 0);
      return acc;
    }, {});

    return Object.values(dailyStats).sort((a, b) => new Date(a.name) - new Date(b.name));
  };

  const chartData = prepareChartData();

  const prepareRevenueTrendData = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = transactions
      .filter(tx => new Date(tx.createdAt) >= thirtyDaysAgo)
      .reduce((acc, tx) => {
        const date = new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!acc[date]) acc[date] = { name: date, LoanRevenue: 0, GigRevenue: 0 };
        
        if (tx.type === 'Loan') acc[date].LoanRevenue += (tx.platformRevenue || 0);
        if (tx.type === 'Gig') acc[date].GigRevenue += (tx.platformRevenue || 0);
        return acc;
      }, {});

    return Object.values(dailyStats).sort((a, b) => new Date(a.name) - new Date(b.name));
  };

  const revenueTrendData = prepareRevenueTrendData();

  const prepareUserGrowthData = () => {
    const allUsers = [...borrowers, ...lenders];
    // Filter duplicates based on ID
    const uniqueUsers = Array.from(new Map(allUsers.map(u => [u._id, u])).values());
    
    if (uniqueUsers.length === 0) return [];

    const dailyGrowth = uniqueUsers.reduce((acc, user) => {
      const date = new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const sortedDates = Object.keys(dailyGrowth).sort((a, b) => new Date(a) - new Date(b));
    
    let cumulative = 0;
    return sortedDates.map(date => {
      cumulative += dailyGrowth[date];
      return { name: date, TotalUsers: cumulative, NewUsers: dailyGrowth[date] };
    });
  };

  const preparePieData = () => {
    if (!summary) return [];
    return [
      { name: 'Active', value: summary.totalActive, color: '#8b5cf6' },
      { name: 'Completed', value: summary.totalCompleted, color: '#10b981' },
      { name: 'Pending', value: summary.totalPending, color: '#f59e0b' }
    ].filter(item => item.value > 0);
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
            <h3>Gig Platform Fees (10%)</h3>
            <p className="amount" style={{ color: '#10b981' }}>ZMW {summary.gigFees?.toFixed(2) || '0.00'}</p>
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

      <div className="card mb-4 mt-4">
        <div className="section-heading mb-4">
          <h3>💰 Revenue Breakdown (Last 30 Days)</h3>
          <p className="text-muted">Comparing earnings from Loans vs Gigs.</p>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <AreaChart data={revenueTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLoan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGig" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} tickFormatter={(v) => `K${v}`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" dataKey="LoanRevenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorLoan)" name="Loan Revenue" />
              <Area type="monotone" dataKey="GigRevenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGig)" name="Gig Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mb-4 mt-4">
        <div className="section-heading mb-4">
          <h3>📈 Platform Analytics</h3>
          <p className="text-muted">Visualizing loan volume and platform revenue flow.</p>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} tickFormatter={(value) => `K${value}`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="Volume" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Loan Volume" />
              <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Platform Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="section-heading mb-4">
            <h3>👥 User Growth</h3>
            <p className="text-muted">Total registered users over time.</p>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={prepareUserGrowthData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="NewUsers" name="New Users" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-heading mb-4">
            <h3>📊 Loan Status Distribution</h3>
            <p className="text-muted">Current status of all system loans.</p>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={preparePieData()} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {preparePieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      {/* BC Payable Loan Applications */}
      <div className="card mb-4 mt-4">
        <div className="section-heading mb-4">
          <h3>🎓 Pending BC Payable Loan Applications</h3>
          <p className="text-muted">Review students in need of urgent BC Payable loans.</p>
        </div>

        {pendingBcLoans.length === 0 ? (
          <p className="text-muted">No pending BC loan applications.</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Contact / Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBcLoans.map((app) => (
                  <tr key={app._id}>
                    <td>
                      <strong>{app.borrowerId?.firstName} {app.borrowerId?.lastName}</strong><br/>
                      <small>{app.borrowerId?.email}</small>
                    </td>
                    <td>ZMW {app.amount?.toFixed(2)}</td>
                    <td>
                      <p className="mb-0">📞 {app.phoneNumber || app.borrowerId?.phone}</p>
                      <small className="text-muted">{app.studentDetails}</small>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-sm btn-primary me-2" onClick={() => window.open(`tel:${app.phoneNumber}`)}>
                        Contact
                      </button>
                      <button className="btn btn-sm btn-success" onClick={() => handleApproveBcLoan(app._id)} disabled={bcLoanActionLoading}>
                        {bcLoanActionLoading ? '...' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Gig Applications Section */}
      <div className="card mb-4 mt-4">
        <div className="section-heading mb-4">
          <h3>📋 Pending Gig Applications</h3>
          <p className="text-muted">Review worker applications and hire the best candidate.</p>
        </div>

        {pendingGigApplications.length === 0 ? (
          <p className="text-muted">No pending gig applications for review.</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Gig Details</th>
                  <th>Poster</th>
                  <th>Applicants</th>
                </tr>
              </thead>
              <tbody>
                {pendingGigApplications.map((gig) => (
                  <tr key={gig._id}>
                    <td>
                      <strong>{gig.title}</strong><br/>
                      <small>Budget: ZMW {gig.budget}</small>
                    </td>
                    <td>{gig.posterId?.firstName} {gig.posterId?.lastName}</td>
                    <td>
                      {gig.applicants.map(app => (
                        <div key={app.userId?._id} className="p-2 mb-2 border-bottom">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{app.userId?.firstName} {app.userId?.lastName}</strong>
                              <p className="mb-0 small">📞 {app.userId?.phone || 'N/A'}</p>
                              {app.message && <p className="mb-0 italic small">"{app.message}"</p>}
                            </div>
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-sm btn-primary" 
                                onClick={() => handleHireWorkerAdmin(gig._id, app.userId?._id)}
                                disabled={gigActionLoading}
                              >Hire</button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeclineApplicantAdmin(gig._id, app.userId?._id)}
                                disabled={gigActionLoading}
                              >Decline</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                  <th>Type</th>
                  <th>Date</th>
                  <th>ID</th>
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
                    <td>
                      <span className={`badge ${tx.type === 'Gig' ? 'badge-info' : 'badge-primary'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {new Date(tx.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
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
