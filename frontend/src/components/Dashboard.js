import React, { useState, useEffect, useCallback } from 'react';
import { loanAPI, collateralAPI, gigAPI, adminAPI } from '../utils/api';
import '../styles/dashboard.css';
import { Users, DollarSign, Handshake, PiggyBank, Coins } from 'lucide-react'; // Added Coins

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

const Dashboard = ({ currentUser, setCurrentPage, onQuickGigApply }) => {
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    healthRatio: 75,
    collateralValue: 0,
    interestRate: 8.5
  });
  const [collateralItems, setCollateralItems] = useState([]);
  // Removed eligibility and isChecking states as per new requirements
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [studentDetails, setStudentDetails] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '');
  const [isApplying, setIsApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const userId = currentUser?.id || currentUser?._id;

  const [quickGigs, setQuickGigs] = useState([]);
  const [dailyQuote, setDailyQuote] = useState("");
  const [gigSummary, setGigSummary] = useState({
    pendingApplicationsReceived: 0,
    activeJobs: 0
  });
  const [activeAds, setActiveAds] = useState([]);
  const [showFloatingAd, setShowFloatingAd] = useState(true);

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

  const fetchAds = useCallback(async () => {
    try {
      const res = await adminAPI.getAds();
      setActiveAds(res.data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
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
      fetchAds();
    }
  }, [userId, fetchLoans, fetchCollateral, fetchQuickGigs, fetchGigActivitySummary, fetchAds]);

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

  // Renamed and refactored handleCheckEligibility to handleApplyForLoan
  const handleApplyForLoan = async () => {
    if (!showLoanForm) {
      // First click: show the form
      setShowLoanForm(true);
      setApplicationMessage(null); // Clear previous messages
      // Pre-fill student details if available from currentUser
      setStudentDetails(`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}, Program: ${currentUser?.programOfStudy || ''}, Computer No: ${currentUser?.computerNumber || ''}`.trim());
      setPhoneNumber(currentUser?.phone || '');
    } else {
      // Second click: submit the form
      if (!loanAmount || isNaN(parseFloat(loanAmount)) || parseFloat(loanAmount) <= 0) {
        setApplicationMessage({ type: 'error', text: 'Please enter a valid loan amount.' });
        return;
      }
      if (!studentDetails.trim()) {
        setApplicationMessage({ type: 'error', text: 'Please provide your student details.' });
        return;
      }
      if (!phoneNumber.trim()) {
        setApplicationMessage({ type: 'error', text: 'Please provide your phone number.' });
        return;
      }

      setIsApplying(true);
      setApplicationMessage(null);

      try {
        await loanAPI.applyForBcLoan({
          userId,
          amount: loanAmount,
          studentDetails,
          phoneNumber
        });

        setApplicationMessage({
          type: 'success',
          text: 'Your loan application has been submitted. We will assess it and provide feedback shortly.'
        });
        setLoanAmount('');
        // Optionally clear studentDetails and phoneNumber, or keep pre-filled for convenience
        // setStudentDetails(''); 
        // setPhoneNumber(''); 
        setShowLoanForm(false); // Hide the form after successful submission
      } catch (error) {
        console.error('Error submitting loan application:', error);
        setApplicationMessage({
          type: 'error',
          text: error.response?.data?.error || 'Failed to submit loan application. Please try again.'
        });
      } finally {
        setIsApplying(false);
      }
    }
  };


  return (
    <div className="dashboard">
      {/* Sticky Top Banner Ads */}
      {activeAds.filter(ad => ad.placement === 'top').map(ad => (
        <div key={ad._id} className="top-ad-banner" style={{ background: '#8b5cf6', color: '#fff', textAlign: 'center', padding: '12px', position: 'sticky', top: 0, zIndex: 1100, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
             <span className="badge bg-white text-primary">NEW</span>
             {ad.title}
             <span style={{ fontSize: '12px' }}>Click to learn more ➔</span>
          </a>
        </div>
      ))}

      <div className="container">
        {/* Money Quote Bubble */}
        <div className="money-quote-bubble mb-4" style={{
          background: 'linear-gradient(135deg, #7dd3fc 0%, #e0f2fe 100%)',
          borderRadius: '25px',
          padding: '25px',
          color: '#075985',
          boxShadow: '0 10px 30px rgba(125, 211, 252, 0.5)',
          position: 'relative',
          animation: 'float 3s ease-in-out infinite',
          border: '2px solid #7dd3fc',
          textAlign: 'center'
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
        <div className="card mt-3" style={{ 
          borderRadius: '20px', 
          border: '1px solid #bae6fd', 
          boxShadow: '0 10px 25px rgba(186, 230, 253, 0.4)', 
          background: 'linear-gradient(135deg, #7dd3fc 0%, #e0f2fe 100%)',
          padding: '25px',
          textAlign: 'center'
        }}>
          <div className="d-flex flex-column align-items-center gap-3">
            <div>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#075985' }}>🛠️ Activity Summary</h4>
              <p className="text-muted mb-0" style={{ fontSize: '14px', color: '#0369a1' }}>Real-time overview of your campus work</p>
            </div>
            <div className="d-flex gap-4 text-center">
              <div className="summary-stat p-2 px-4" style={{ backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #d1fae5' }}>
                <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#059669' }}>{gigSummary.pendingApplicationsReceived}</span>
                <small className="text-muted">New Apps</small>
              </div>
              <div className="summary-stat p-2 px-4" style={{ backgroundColor: '#f5f3ff', borderRadius: '12px', border: '1px solid #ede9fe' }}>
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

        {/* Loan Application Section (formerly Eligibility Section) */}
        <div className="card eligibility-card mt-4 bc-loan-promo-card">
          <div className="bc-loan-promo-header">
            <div className="bc-loan-promo-icons">
              <Users className="floating-icon icon-1" size={50} />
              <DollarSign className="floating-icon icon-2" size={40} />
              <Handshake className="floating-icon icon-3" size={45} />
              <PiggyBank className="floating-icon icon-4" size={35} />
              <Coins className="floating-icon icon-5" size={30} />
            </div>
            <h3 className="promo-title">ARE YOU IN NEED OF A BC PAYABLE LOAN?</h3>
            <p>Fill in your details and the amount you need. We will assess your application and provide feedback.</p>
          </div>
          
          {showLoanForm && (
            <div className="loan-application-form mt-3" style={{ position: 'relative', zIndex: 2 }}>
              <div className="mb-3">
                <label htmlFor="loanAmount" className="form-label">Loan Amount (ZMW)</label>
                <input
                  type="number"
                  id="loanAmount"
                  className="form-control"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="e.g., 500"
                  min="1"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="studentDetails" className="form-label">Student Details</label>
                <textarea
                  id="studentDetails"
                  className="form-control"
                  value={studentDetails}
                  onChange={(e) => setStudentDetails(e.target.value)}
                  placeholder="e.g., John Doe, Computer Science, 12345678"
                  rows="3"
                  required
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  className="form-control"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., +260971234567"
                  required
                />
              </div>
            </div>
          )}

          <button className="btn btn-primary mt-3" onClick={handleApplyForLoan} disabled={isApplying} style={{ position: 'relative', zIndex: 2 }}>
            {isApplying ? 'Submitting...' : (showLoanForm ? 'Submit Application' : 'Apply for Loan')}
          </button>

          {applicationMessage && (
            <div className={`mt-3 alert alert-${applicationMessage.type === 'success' ? 'success' : 'danger'}`} style={{ position: 'relative', zIndex: 2 }}>
              {applicationMessage.text}
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
                  <button className="btn btn-secondary" onClick={() => setCurrentPage('loans')}>
                    Manage
                  </button>
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


      {/* Centered Popup Overlay Ads */}
      {showFloatingAd && activeAds.filter(ad => ad.placement === 'popup').map(ad => (
        <div key={ad._id} className="ad-popup-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="ad-popup-content shadow-lg" style={{ maxWidth: '400px', width: '100%', position: 'relative', animation: 'scaleUp 0.3s ease-out' }}>
            <button className="btn-close" style={{ position: 'absolute', top: '-45px', right: '0', color: '#fff', border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer' }} onClick={() => setShowFloatingAd(false)}>✕</button>
            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', borderRadius: '20px', border: '4px solid #fff', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
              <div className="p-4 bg-white mt-3" style={{ borderRadius: '15px', textAlign: 'center' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>{ad.title}</h3>
                <button className="btn btn-primary w-100">Check it Out</button>
              </div>
            </a>
          </div>
        </div>
      ))}

      {/* Bottom Floating Ads (Boomplay Style) */}
      {showFloatingAd && activeAds.filter(ad => ad.placement === 'bottom').map(ad => (
        <div key={ad._id} className="floating-ad-overlay" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, maxWidth: '280px', animation: 'slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1)' }}>
          <div className="card shadow-lg p-0 overflow-hidden" style={{ borderRadius: '16px', border: '2px solid #8b5cf6', background: '#fff' }}>
            <div className="ad-header d-flex justify-content-between align-items-center p-2 px-3 border-bottom">
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8b5cf6', textTransform: 'uppercase' }}>Promoted</span>
              <button className="btn-close" style={{ fontSize: '14px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowFloatingAd(false)}>✕</button>
            </div>
            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
              <div className="p-3">
                <h6 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#0f172a' }}>{ad.title}</h6>
                <p className="text-muted small mb-0">Learn More ➔</p>
              </div>
            </a>
          </div>
        </div>
      ))}

    </div>
  );
};

export default Dashboard;
