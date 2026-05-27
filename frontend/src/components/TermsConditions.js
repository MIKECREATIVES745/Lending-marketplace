import React, { useState, useEffect } from 'react';
import { siteContentAPI } from '../utils/api';
import '../styles/site-pages.css';

const TermsConditions = ({ setCurrentPage }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await siteContentAPI.getContent('terms_conditions');
        setContent(response.data);
      } catch (error) {
        // Use default content if not found
        setContent({
          title: 'Terms & Conditions',
          content: `
            <h2 style="margin-bottom: 1.5rem;">Terms & Conditions for Smart Money</h2>
            <p style="margin-bottom: 1.5rem;">Last Updated: ${new Date().toLocaleDateString()}</p>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">1. Acceptance of Terms</h3>
            <p style="margin-bottom: 1.5rem;">By accessing and using Smart Money, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">2. User Responsibilities</h3>
            <p style="margin-bottom: 1.5rem;">Users are responsible for maintaining the confidentiality of their account information and passwords. You agree to accept responsibility for all activities that occur under your account.</p>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">3. Prohibited Activities</h3>
            <p style="margin-bottom: 1.5rem;">You may not use the platform for any illegal purposes, harassment, fraud, or misrepresentation. Users must treat other users with respect and professionalism.</p>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">4. Limitation of Liability</h3>
            <p style="margin-bottom: 1.5rem;">Smart Money is provided on an "as-is" basis. We do not guarantee the accuracy of user-posted content or the success of any transactions.</p>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">5. Dispute Resolution</h3>
            <p style="margin-bottom: 1.5rem;">Any disputes arising from the use of this platform will be governed by Zambian law and resolved through appropriate legal channels.</p>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">6. Changes to Terms</h3>
            <p style="margin-bottom: 1.5rem;">We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms.</p>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">7. Contact Information</h3>
            <p style="margin-bottom: 1.5rem;">For questions regarding these terms, contact us at mikecreatives745@gmail.com or WhatsApp us on 0975132507</p>
          `
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return <div className="container site-page"><p>Loading...</p></div>;
  }

  return (
    <div className="container site-page">
      <button className="btn btn-outline mb-3" onClick={() => setCurrentPage('dashboard')}>
        ← Back
      </button>
      {content && (
        <div className="card">
          <h1>{content.title}</h1>
          <div
            className="site-content"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        </div>
      )}
    </div>
  );
};

export default TermsConditions;
