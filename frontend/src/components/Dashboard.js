import React, { useState, useEffect } from 'react';
import { loanAPI, collateralAPI } from '../utils/api';
import '../styles/dashboard.css';

const Dashboard = ({ currentUser }) => {
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    healthRatio: 75,
    collateralValue: 0,
    interestRate: 8.5
  });
  const [collateralItems, setCollateralItems] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const userId = currentUser?.id || currentUser?._id;

  useEffect(() => {
    if (userId) {
      fetchLoans();
      fetchCollateral();
    }
  }, [userId]);

  const fetchLoans = async () => {
    try {
      const res = await loanAPI.getUserLoans(userId);
      setLoans(res.data);

      const totalBorrowed = res.data.reduce((sum, loan) => sum + loan.amount, 0);
      const totalRepaid = res.data.reduce((sum, loan) => sum + loan.totalRepaid, 0);

      setStats((prev) => ({
        ...prev,
        totalBalance: totalBorrowed - totalRepaid,
        healthRatio: prev.healthRatio,
        interestRate: prev.interestRate
      }));
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const fetchCollateral = async () => {
    try {
      const res = await collateralAPI.getUserCollateral(userId);
      setCollateralItems(res.data);
      const totalCollateralValue = res.data.reduce((sum, item) => sum + item.estimatedValue, 0);
      setStats((prev) => ({
        ...prev,
        collateralValue: totalCollateralValue || prev.collateralValue
      }));
    } catch (error) {
      console.warn('Unable to fetch collateral from server, using local state only', error);
      setCollateralItems([]);
    }
  };

  const collateralOptions = [
    {
      label: 'Add Laptop',
      itemName: 'Laptop',
      category: 'electronics',
      description: 'Student laptop for loan collateral',
      condition: 'good',
      estimatedValue: 3200
    },
    {
      label: 'Add Tech Gear',
      itemName: 'Camera & Accessories',
      category: 'electronics',
      description: 'Camera and valuable tech gear',
      condition: 'good',
      estimatedValue: 1800
    },
    {
      label: 'Add Other Items',
      itemName: 'Miscellaneous Collateral',
      category: 'other',
      description: 'Other valuable items for collateral',
      condition: 'fair',
      estimatedValue: 1100
    }
  ];

  const addCollateralItem = async (option) => {
    setEligibility(null);
    const collateralPayload = {
      userId,
      itemName: option.itemName,
      category: option.category,
      description: option.description,
      condition: option.condition,
      estimatedValue: option.estimatedValue,
      status: 'available'
    };

    try {
      const res = await collateralAPI.addCollateral(collateralPayload);
      const newItem = res.data;
      setCollateralItems((prev) => [...prev, newItem]);
      setStats((prev) => ({
        ...prev,
        collateralValue: prev.collateralValue + option.estimatedValue
      }));
    } catch (error) {
      console.warn('Backend collateral save failed, preserving item locally', error);
      const tempItem = {
        ...collateralPayload,
        _id: `local-${Date.now()}`
      };
      setCollateralItems((prev) => [...prev, tempItem]);
      setStats((prev) => ({
        ...prev,
        collateralValue: prev.collateralValue + option.estimatedValue
      }));
    }
  };

  const handleCheckEligibility = () => {
    setIsChecking(true);
    const collateralValue = stats.collateralValue;
    const hasProfile = Boolean(currentUser?.phone && currentUser?.programOfStudy && currentUser?.computerNumber);
    const profileScore = hasProfile ? 30 : 10;
    const collateralScore = Math.min(50, Math.round((collateralValue / 5000) * 50));
    const loanHistoryScore = loans.length === 0 ? 20 : 10;
    const totalScore = Math.min(100, profileScore + collateralScore + loanHistoryScore);
    const eligible = totalScore >= 60 && collateralValue >= 1500;

    setTimeout(() => {
      setEligibility({
        eligible,
        score: totalScore,
        message: eligible
          ? 'Great news! Based on your profile and collateral value, you qualify for a UNZA student loan.'
          : 'Not yet eligible. Add more collateral or complete your profile to improve your score.'
      });
      setIsChecking(false);
    }, 350);
  };

  return (
    <div className="dashboard">
      <div className="container">
        {/* Loan Balance Card */}
        <div className="card gradient-card loan-card">
          <div className="loan-card-header">
            <div>
              <h3>Total Loan Balance</h3>
              <p className="balance">ZMW {stats.totalBalance.toFixed(2)}</p>
            </div>
            <div className="payment-period">
              <p>Payment Period</p>
              <p className="period-value">30 Days</p>
            </div>
          </div>
          
          <div className="loan-card-details">
            <div className="detail-item">
              <label>Health Ratio</label>
              <div className="health-bar">
                <div className="health-fill" style={{ width: `${stats.healthRatio}%` }}></div>
              </div>
              <span>{stats.healthRatio}% Good</span>
            </div>
            
            <div className="detail-row">
              <div className="detail-item">
                <label>Collateral Value</label>
                <p>ZMW {stats.collateralValue.toFixed(2)}</p>
              </div>
              <div className="detail-item">
                <label>Interest Rate</label>
                <p>{stats.interestRate.toFixed(1)}% APR</p>
              </div>
            </div>
          </div>
        </div>

        {/* Eligibility Section */}
        <div className="card eligibility-card mt-4">
          <h3>Do You Qualify for a UNZA Student Loan?</h3>
          <p>Find out if you qualify and check your eligibility for a UNZA student loan with our quick assessment.</p>
          <button className="btn btn-primary" onClick={handleCheckEligibility} disabled={isChecking}>
            {isChecking ? 'Checking...' : '✓ Check Eligibility'}
          </button>

          {eligibility && (
            <div className={`eligibility-result ${eligibility.eligible ? 'eligible' : 'not-eligible'}`}>
              <p><strong>Score:</strong> {eligibility.score}/100</p>
              <p>{eligibility.message}</p>
            </div>
          )}
        </div>

        {/* My Loans */}
        <div className="mt-4">
          <h3>My Loans</h3>
          <div className="loans-list">
            {loans.length > 0 ? loans.map(loan => (
              <div key={loan._id} className="card loan-item">
                <div className="loan-header">
                  <div>
                    <h4>{loan.purpose || 'UNZA Student Loan'}</h4>
                    <p className="loan-amount">ZMW {loan.amount.toFixed(2)}</p>
                  </div>
                  <button className="btn btn-secondary">Manage</button>
                </div>
                <div className="loan-details">
                  <p>📦 Collateral: {loan.collateralValue ? `ZMW ${loan.collateralValue.toFixed(2)}` : 'Not specified'}</p>
                  <p>📅 {loan.paymentPeriod || loan.loanTerm || '30'} Days</p>
                </div>
              </div>
            )) : (
              <div className="card loan-item">
                <p>No loans found yet. Add collateral and check eligibility to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Collateral Overview */}
        <div className="mt-4">
          <div className="section-heading">
            <h3>Collateral Overview</h3>
            <p className="text-muted">Secure a loan by adding your laptop, tech gear, or other valuable items as collateral.</p>
          </div>

          <div className="collateral-grid mt-3">
            {collateralOptions.map((option) => (
              <button
                key={option.label}
                className="collateral-btn"
                onClick={() => addCollateralItem(option)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <h4>My Collateral Items</h4>
            <div className="collateral-list">
              {collateralItems.length > 0 ? collateralItems.map((item) => (
                <div key={item._id} className="card collateral-item">
                  <div className="collateral-item-header">
                    <h4>{item.itemName}</h4>
                    <span className="badge badge-success">{item.status || 'available'}</span>
                  </div>
                  <p>{item.description}</p>
                  <div className="collateral-details">
                    <span>{item.category}</span>
                    <span>{item.condition}</span>
                    <strong>ZMW {item.estimatedValue.toFixed(2)}</strong>
                  </div>
                </div>
              )) : (
                <div className="card collateral-item">
                  <p>No collateral items added yet. Use the buttons above to add items.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
