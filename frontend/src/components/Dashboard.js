import React, { useState, useEffect, useCallback } from 'react';
import { loanAPI, collateralAPI, gigAPI } from '../utils/api';
import '../styles/dashboard.css';

const Dashboard = ({ currentUser, setCurrentPage, onQuickGigApply }) => {
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

  const [quickGigs, setQuickGigs] = useState([]);
  const [dailyQuote, setDailyQuote] = useState("");
  const [gigSummary, setGigSummary] = useState({
    pendingApplicationsReceived: 0,
    activeJobs: 0
  });

  const moneyQuotes = [
    "Wealth is the ability to fully experience life. — Henry David Thoreau",
    "Money is a tool. Used properly, it makes something; used poorly, it makes a mess.",
    "The more you learn, the more you earn. — Warren Buffett",
    "A wise person should have money in their head, but not in their heart. — Jonathan Swift",
    "Don't stay in bed, unless you can make money in bed. — George Burns",
    "Investing in yourself is the best investment you will ever make.",
    "Formal education will make you a living; self-education will make you a fortune. — Jim Rohn",
    "Price is what you pay. Value is what you get. — Warren Buffett",
    "The goal isn’t more money. The goal is living life on your terms. — Chris Brogan",
    "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver. — Ayn Rand",
    "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make. — Dave Ramsey",
    "It’s not how much money you make, but how much money you keep. — Robert Kiyosaki",
    "The lack of money is the root of all evil. — Mark Twain",
    "Opportunity is missed by most people because it is dressed in overalls and looks like work. — Thomas Edison",
    "Never depend on single income. Make investment to create a second source. — Warren Buffett",
    "Beware of little expenses; a small leak will sink a great ship. — Benjamin Franklin",
    "Money often costs too much. — Ralph Waldo Emerson",
    "He who loses money, loses much; He who loses a friend, loses much more; He who loses faith, loses all.",
    "Wealth consists not in having great possessions, but in having few wants. — Epictetus",
    "An investment in knowledge pays the best interest. — Benjamin Franklin",
    "I will tell you the secret to getting rich on Wall Street. You try to be greedy when others are fearful. — Warren Buffett",
    "Success is not just about what you accomplish in your life; it’s about what you inspire others to do.",
    "Fortune favors the bold.",
    "The safe way to double your money is to fold it over once and put it in your pocket. — Kin Hubbard",
    "Money is like muck—not good unless it be spread. — Francis Bacon",
    "Time is more value than money. You can get more money, but you cannot get more time. — Jim Rohn",
    "A penny saved is a penny earned. — Benjamin Franklin",
    "If you would be wealthy, think of saving as well as getting. — Benjamin Franklin",
    "The art is not in making money, but in keeping it. — Proverb",
    "Wealth is like sea-water; the more we drink, the thirstier we become. — Arthur Schopenhauer",
    "Money is the soul of business.",
    "Rich people have small TVs and big libraries, and poor people have small libraries and big TVs. — Zig Ziglar",
    "Every day is a bank account, and time is our currency. No one is rich, no one is poor, we've got 24 hours each.",
    "To get rich, you have to be making money while you're asleep. — David Bailey",
    "Empty pockets never held anyone back. Only empty heads and empty hearts can do that. — Norman Vincent Peale",
    "The financial markets are a device for transferring money from the impatient to the patient. — Warren Buffett",
    "A simple fact that is hard to learn is that the time to save money is when you have some. — Joe Moore",
    "Money is power, and you ought to be reasonably ambitious to have it.",
    "Before you can become a millionaire, you must learn to think like one. — Thomas J. Stanley",
    "You must gain control over your money or the lack of it will forever control you. — Dave Ramsey",
    "If you live for having it all, what you have is never enough. — Vicki Robin",
    "Financial freedom is available to those who learn about it and work for it. — Robert Kiyosaki",
    "Don't let making a living prevent you from making a life. — John Wooden",
    "The quickest way to double your money is to fold it in half and put it in your back pocket. — Will Rogers",
    "Many people take no care of their money till they come nearly to the end of it.",
    "Money speaks only one language: If you save me today, I will save you tomorrow.",
    "Your income can grow only to the extent that you do! — T. Harv Eker",
    "Don't tell me what you value, show me your budget, and I'll tell you what you value. — Joe Biden",
    "A bank is a place that will lend you money if you can prove that you don’t need it. — Bob Hope",
    "If you want to know what a man is really like, take notice of how he acts when he loses money. — New England Proverb"
  ];

  useEffect(() => {
    // Get a deterministic random quote for the day
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    setDailyQuote(moneyQuotes[dayOfYear % moneyQuotes.length]);
  }, []);

  const fetchQuickGigs = useCallback(async () => {
    try {
      const res = await gigAPI.getGigs();
      const gigsData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setQuickGigs(gigsData.slice(0, 3));
    } catch (error) {
      console.error('Error fetching quick gigs:', error);
    }
  }, []);

  const fetchGigActivitySummary = useCallback(async () => {
    if (!userId) return;
    try {
      const [myGigsRes, myJobsRes] = await Promise.all([
        gigAPI.getMyGigs(),
        gigAPI.getMyJobs()
      ]);
      const myGigs = myGigsRes.data?.data || myGigsRes.data || [];
      const myJobs = myJobsRes.data?.data || myJobsRes.data || [];
      
      const pending = myGigs.reduce((acc, g) => g.status === 'open' ? acc + (g.applicants?.length || 0) : acc, 0);
      setGigSummary({ pendingApplicationsReceived: pending, activeJobs: myJobs.length });
    } catch (err) {
      console.error('Error fetching gig summary:', err);
    }
  }, [userId]);

  const isPoster = (poster) => {
    if (!userId || !poster) return false;
    const pId = typeof poster === 'string' ? poster : poster._id || poster.id;
    return String(userId) === String(pId);
  };

  const fetchLoans = useCallback(async () => {
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
  }, [userId]);

  const fetchCollateral = useCallback(async () => {
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
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchLoans();
      fetchCollateral();
      fetchQuickGigs();
      fetchGigActivitySummary();
    }
  }, [userId, fetchLoans, fetchCollateral, fetchQuickGigs, fetchGigActivitySummary]);

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
        {/* Money Quote Bubble */}
        <div className="money-quote-bubble mb-4" style={{
          background: '#f3f4f6',
          borderRadius: '30px 30px 30px 5px',
          padding: '25px',
          color: '#374151',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          animation: 'float 3s ease-in-out infinite',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>💡 Daily Wealth Tip</div>
          <p style={{ fontSize: '18px', fontWeight: '500', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>
            "{dailyQuote}"
          </p>
        </div>

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

        {/* Gig Application Summary */}
        <div className="card mt-3" style={{ borderRadius: '20px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <div className="d-flex justify-content-between align-items-center p-2">
            <div className="ps-2">
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>🛠️ Activity Summary</h4>
              <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Real-time overview of your campus work</p>
            </div>
            <div className="d-flex gap-3 text-center">
              <div className="summary-stat p-2 px-3" style={{ backgroundColor: '#ecfdf5', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#059669' }}>{gigSummary.pendingApplicationsReceived}</span>
                <small className="text-muted">New Apps</small>
              </div>
              <div className="summary-stat p-2 px-3" style={{ backgroundColor: '#f5f3ff', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#7c3aed' }}>{gigSummary.activeJobs}</span>
                <small className="text-muted">Active Jobs</small>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Gigs Section */}
        <div className="mt-4">
          <div className="section-header-row">
            <h3>Quick Gigs</h3>
            <button className="btn-link" onClick={() => setCurrentPage('gigs')}>See All</button>
          </div>
          <div className="quick-gigs-scroll">
            {quickGigs.length > 0 ? quickGigs.map(gig => (
              <div key={gig._id} className={`quick-gig-card category-${gig.category}`}>
                <span className="q-category">{gig.category}</span>
                <h4>{gig.title}</h4>
                <p className="q-price">ZMW {gig.budget}</p>
                {!isPoster(gig.posterId) && <button
                  className="btn btn-white btn-sm"
                  onClick={() => onQuickGigApply ? onQuickGigApply(gig) : setCurrentPage('gigs')}
                >
                  Apply Now
                </button>}
              </div>
            )) : (
              <>
                <div className="quick-gig-card category-academic">
                  <span className="q-category">On-Campus Tutor</span>
                  <h4>Tutor (Computer Science)</h4>
                  <p className="q-price">ZMW 350</p>
                  <button className="btn btn-white btn-sm" onClick={() => setCurrentPage('gigs')}>Apply Now</button>
                </div>
                <div className="quick-gig-card category-design">
                  <span className="q-category">Manual Labor</span>
                  <h4>Manual Labor (Event Setup)</h4>
                  <p className="q-price">ZMW 200</p>
                  <button className="btn btn-white btn-sm" onClick={() => setCurrentPage('gigs')}>Apply Now</button>
                </div>
                <div className="quick-gig-card category-delivery">
                  <span className="q-category">On-Campus Runner</span>
                  <h4>Library Assistant</h4>
                  <p className="q-price">ZMW 180</p>
                  <button className="btn btn-white btn-sm" onClick={() => setCurrentPage('gigs')}>Apply Now</button>
                </div>
              </>
            )}
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
