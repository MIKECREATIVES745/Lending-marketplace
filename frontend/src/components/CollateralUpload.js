import React, { useState, useEffect } from 'react';
import { collateralAPI } from '../utils/api';
import '../styles/collateral.css';

const CollateralUpload = ({ currentUser }) => {
  const [collateralItems, setCollateralItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'electronics',
    estimatedValue: '',
    description: '',
    condition: 'good'
  });

  // Load user's collateral
  useEffect(() => {
    if (currentUser?.id) {
      loadCollateral();
    }
  }, [currentUser?.id]);

  const loadCollateral = async () => {
    try {
      const response = await collateralAPI.getUserCollateral(currentUser.id);
      setCollateralItems(response.data);
    } catch (err) {
      console.error('Error loading collateral:', err);
      setError('Failed to load collateral items');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file sizes (10MB each)
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setFiles(validFiles);
    if (validFiles.length < selectedFiles.length) {
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.itemName || !formData.estimatedValue) {
        setError('Item name and estimated value are required');
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('userId', currentUser.id);
      uploadData.append('itemName', formData.itemName);
      uploadData.append('category', formData.category);
      uploadData.append('estimatedValue', parseFloat(formData.estimatedValue));
      uploadData.append('description', formData.description);
      uploadData.append('condition', formData.condition);

      // Add files
      files.forEach((file, index) => {
        uploadData.append('files', file);
      });

      const response = await collateralAPI.addCollateral(uploadData);
      
      setSuccess(`Collateral item "${formData.itemName}" added successfully!`);
      setFormData({
        itemName: '',
        category: 'electronics',
        estimatedValue: '',
        description: '',
        condition: 'good'
      });
      setFiles([]);
      
      // Reload collateral list
      await loadCollateral();
      setShowForm(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add collateral');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (collateralId) => {
    if (window.confirm('Are you sure you want to delete this collateral item?')) {
      try {
        await collateralAPI.deleteCollateral(collateralId);
        setSuccess('Collateral item deleted');
        await loadCollateral();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete collateral item');
      }
    }
  };

  return (
    <div className="collateral-container">
      <div className="collateral-header">
        <h2>📦 My Collateral Items</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '➕ Add New Item'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="collateral-form-container">
          <form onSubmit={handleSubmit} className="collateral-form">
            <h3>Add Collateral Item</h3>

            <div className="form-group">
              <label>Item Name *</label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleFormChange}
                placeholder="e.g., Laptop, Mountain Bike"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleFormChange}>
                  <option value="electronics">Electronics</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Condition *</label>
                <select name="condition" value={formData.condition} onChange={handleFormChange}>
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Estimated Value (ZMW) *</label>
              <input
                type="number"
                name="estimatedValue"
                value={formData.estimatedValue}
                onChange={handleFormChange}
                placeholder="e.g., 5000"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Describe the item in detail (brand, model, features, etc.)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Upload Photos & Documents</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                className="file-input"
              />
              <p className="file-help">
                Upload images or documents (PDF, Word). Max 10MB per file.
                {files.length > 0 && ` ${files.length} file(s) selected`}
              </p>
              {files.length > 0 && (
                <div className="file-list">
                  {files.map((file, idx) => (
                    <div key={idx} className="file-item">
                      📄 {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Add Collateral Item'}
            </button>
          </form>
        </div>
      )}

      <div className="collateral-list">
        {collateralItems.length === 0 ? (
          <div className="empty-state">
            <p>No collateral items yet. Add one to get started!</p>
          </div>
        ) : (
          collateralItems.map(item => (
            <div key={item._id} className="collateral-card">
              <div className="card-header">
                <h3>{item.itemName}</h3>
                <span className={`status-badge status-${item.status}`}>{item.status}</span>
              </div>

              <div className="card-content">
                <div className="info-row">
                  <span className="label">Category:</span>
                  <span className="value">{item.category}</span>
                </div>
                <div className="info-row">
                  <span className="label">Condition:</span>
                  <span className="value">{item.condition}</span>
                </div>
                <div className="info-row">
                  <span className="label">Estimated Value:</span>
                  <span className="value">ZMW {item.estimatedValue.toLocaleString()}</span>
                </div>
                {item.description && (
                  <div className="info-row">
                    <span className="label">Description:</span>
                    <span className="value">{item.description}</span>
                  </div>
                )}

                {item.images.length > 0 && (
                  <div className="images-preview">
                    <h4>📷 Images ({item.images.length})</h4>
                    <div className="images-grid">
                      {item.images.map((img, idx) => (
                        <img key={idx} src={img} alt={`${item.itemName}-${idx}`} />
                      ))}
                    </div>
                  </div>
                )}

                {item.documents.length > 0 && (
                  <div className="documents-list">
                    <h4>📄 Documents ({item.documents.length})</h4>
                    {item.documents.map((doc, idx) => (
                      <a key={idx} href={doc} target="_blank" rel="noopener noreferrer">
                        View Document {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button 
                  className="btn btn-small btn-danger"
                  onClick={() => handleDelete(item._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CollateralUpload;
