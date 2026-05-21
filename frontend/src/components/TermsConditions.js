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
            <h2>Terms & Conditions for Smart Money</h2>
            <p>Last Updated: ${new Date().toLocaleDateString()}</p>
            
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using Smart Money, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            <h3>2. User Responsibilities</h3>
            <p>Users are responsible for maintaining the confidentiality of their account information and passwords. You agree to accept responsibility for all activities that occur under your account.</p>
            
            <h3>3. Prohibited Activities</h3>
            <p>You may not use the platform for any illegal purposes, harassment, fraud, or misrepresentation. Users must treat other users with respect and professionalism.</p>
            
            <h3>4. Limitation of Liability</h3>
            <p>Smart Money is provided on an "as-is" basis. We do not guarantee the accuracy of user-posted content or the success of any transactions.</p>
            
            <h3>5. Dispute Resolution</h3>
            <p>Any disputes arising from the use of this platform will be governed by Zambian law and resolved through appropriate legal channels.</p>
            
            <h3>6. Changes to Terms</h3>
            <p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms.</p>
            
            <h3>7. Contact Information</h3>
            <p>For questions regarding these terms, contact us at contact@mikecreatives.inc</p>
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
