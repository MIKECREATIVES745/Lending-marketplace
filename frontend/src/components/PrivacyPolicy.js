import React, { useState, useEffect } from 'react';
import { siteContentAPI } from '../utils/api';
import '../styles/site-pages.css';

const PrivacyPolicy = ({ setCurrentPage }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await siteContentAPI.getContent('privacy_policy');
        setContent(response.data);
      } catch (error) {
        // Use default content if not found
        setContent({
          title: 'Privacy Policy',
          content: `
            <h2>Privacy Policy for Smart Money</h2>
            <p>Last Updated: ${new Date().toLocaleDateString()}</p>
            
            <h3>1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, post a gig, or communicate with other users. This includes your name, email address, phone number, and location.</p>
            
            <h3>2. How We Use Your Information</h3>
            <p>We use the information we collect to operate and improve our services, process transactions, send you technical notices, and respond to your inquiries.</p>
            
            <h3>3. Data Security</h3>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access or alteration.</p>
            
            <h3>4. Third-Party Sharing</h3>
            <p>We do not sell your personal information to third parties. We may share information when required by law or to protect our rights.</p>
            
            <h3>5. Contact Us</h3>
            <p>If you have questions about this Privacy Policy, please contact us at contact@mikecreatives.inc</p>
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

export default PrivacyPolicy;
