import React, { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../utils/api';
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
  const [pendingBcLoans, setPendingBcLoans] = useState([]);
  const [bcLoanActionLoading, setBcLoanActionLoading] = useState(false); // New loading state for BC loans

  const [ads, setAds] = useState([]);
  const [adForm, setAdForm] = useState({
    title: '',
    imageFile: null, // Changed from imageUrl to imageFile for upload
    linkUrl: '',
    placement: 'sidebar'
  });

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

  const fetchBcApplications = async () => {
    try {
      const res = await adminAPI.getBcApplications();
      setPendingBcLoans(res.data);
    } catch (err) {
      console.error('Failed to load BC applications:', err);
    }
  };

  const fetchAds = async () => {
    try {
      const res = await adminAPI.getAds(); // Assuming adminAPI has this method
      setAds(res.data);
    } catch (err) {
      console.error('Failed to load ads:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAdminData();
    fetchBcApplications();
    fetchAds();
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

  const handleApproveBcLoan = async (loanId) => {
    setMessage('');
    if (!window.confirm('Are you sure you want to approve this BC Payable loan?')) return;
    setBcLoanActionLoading(true);
    try {
      // Assuming adminAPI has an approveBcLoan method
      await adminAPI.approveBcLoan(loanId); 
      setMessage('✅ BC Loan approved successfully!');
      fetchBcApplications();
      fetchAdminData();
    } catch (error) {
      setMessage('❌ Failed to approve loan: ' + (error.response?.data?.error || error.message));
    } finally {
      setBcLoanActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!adForm.imageFile) {
      setMessage('❌ Please upload an image for the advertisement.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', adForm.title);
      formData.append('linkUrl', adForm.linkUrl);
      formData.append('placement', adForm.placement);
      formData.append('image', adForm.imageFile); // 'image' must match the field name in multer middleware
      await adminAPI.createAd(formData);
      setMessage('✅ Advertisement posted successfully!');
      setAdForm({ title: '', imageFile: null, linkUrl: '', placement: 'sidebar' });
      fetchAds();
    } catch (error) {
      setMessage('❌ Failed to post ad: ' + (error.response?.data?.error || error.message));
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?')) return;
    try {
      await adminAPI.deleteAd(adId);
      setMessage('✅ Advertisement deleted.');
      fetchAds();
    } catch (error) {
      setMessage('❌ Failed to delete ad: ' + (error.response?.data?.error || error.message));
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleImageChange = (e) => {
    setAdForm({ ...adForm, imageFile: e.target.files[0] });
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

      {/* Ads Management Section */}
      <div className="card mb-4 mt-4">
        <div className="section-heading mb-4">
          <h3>📢 Platform Advertisements</h3>
          <p className="text-muted">Manage the banners and sponsored content shown to users.</p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* New Ad Form */}
          <div className="ad-form-section">
            <h4>Post New Ad</h4>
            <form onSubmit={handleCreateAd} className="mt-3">
              <div className="form-group mb-2">
                <label>Ad Title</label>
                <input 
                  type="text" 
                  value={adForm.title} 
                  onChange={(e) => setAdForm({...adForm, title: e.target.value})} 
                  placeholder="e.g. 50% Off Tuition Help"
                  required
                />
              </div>
              <div className="form-group mb-2">
                <label>Ad Image *</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
                {adForm.imageFile && <small className="text-muted">Selected: {adForm.imageFile.name}</small>}
                />
              </div>
              <div className="form-group mb-2">
                <label>Target Link (URL)</label>
                <input 
                  type="text" 
                  value={adForm.linkUrl} 
                  onChange={(e) => setAdForm({...adForm, linkUrl: e.target.value})} 
                  placeholder="https://example.com/landing-page"
                  required
                />
              </div>
              <div className="form-group mb-3">
                <label>Placement</label>
                <select 
                  value={adForm.placement} 
                  onChange={(e) => setAdForm({...adForm, placement: e.target.value})}
                >
                  <option value="sidebar">Sidebar</option>
                  <option value="top">Top Banner</option>
                  <option value="bottom">Bottom Banner</option>
                  <option value="popup">Popup</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-full">Post Ad</button>
            </form>
          </div>

          {/* Active Ads List */}
          <div className="active-ads-list">
            <h4>Active Ads ({ads.length})</h4>
            <div className="admin-table-container mt-3">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Image</th>
                    <th>Placement</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map(ad => (
                    <tr key={ad._id}>
                      <td>
                        {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }} />}
                        <strong>{ad.title}</strong><br/>
                        <small className="text-muted">{ad.linkUrl}</small>
                      </td>
                      <td>{ad.placement}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAd(ad._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
