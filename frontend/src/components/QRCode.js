import React, { useState, useEffect } from 'react';
import QRCodeReact from 'qrcode.react';
import { loanAPI } from '../utils/api';
import '../styles/qrcode.css';

function QRCodeComponent({ loanId, currentUser }) {
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoanQRCode();
  }, [loanId]);

  const fetchLoanQRCode = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/loans/${loanId}/qrcode`);
      const data = await response.json();
      if (response.ok) {
        setLoan(data);
        setVerified(data.exchangeVerified);
      } else {
        setError(data.error || 'Failed to load QR code');
      }
    } catch (err) {
      setError('Error loading QR code: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyExchange = async () => {
    try {
      setError('');
      const response = await fetch(`http://localhost:5000/api/loans/${loanId}/verify-exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode })
      });
      
      const data = await response.json();
      if (response.ok) {
        setVerified(true);
        setVerificationCode('');
        alert('Exchange verified successfully!');
        fetchLoanQRCode();
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Error verifying: ' + err.message);
    }
  };

  const downloadQRCode = () => {
    if (!loan?.qrCode) return;
    
    const link = document.createElement('a');
    link.href = loan.qrCode;
    link.download = `loan-${loan.loanId}-qrcode.png`;
    link.click();
  };

  if (loading) return <div className="qrcode-container">Loading QR Code...</div>;

  if (error) return <div className="qrcode-error">{error}</div>;

  return (
    <div className="qrcode-container">
      <div className="qrcode-card">
        <h3>In-Person Exchange QR Code</h3>
        
        {loan?.qrCode && (
          <div className="qrcode-display">
            <img src={loan.qrCode} alt="Loan QR Code" className="qrcode-image" />
            <p className="verification-code">
              Code: <strong>{loan.verificationCode}</strong>
            </p>
          </div>
        )}

        <div className="qrcode-actions">
          <button onClick={downloadQRCode} className="btn-download">
            📥 Download QR Code
          </button>
        </div>

        {!verified && (
          <div className="verification-section">
            <h4>Verify In-Person Exchange</h4>
            <p>After scanning, enter the verification code:</p>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="verification-input"
              />
              <button 
                onClick={handleVerifyExchange}
                className="btn-verify"
                disabled={!verificationCode}
              >
                ✓ Verify Exchange
              </button>
            </div>
          </div>
        )}

        {verified && (
          <div className="verification-success">
            ✓ Exchange Verified
            <p>In-person exchange has been verified and recorded.</p>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default QRCodeComponent;
