import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gigAPI } from '../utils/api';
import '../styles/gig-board.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const gigIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const GigBoard = ({ currentUser, setCurrentPage }) => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: -15.3941, lng: 28.3297 }); // UNZA default
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minBudget: '',
    maxBudget: '',
    radius: 5
  });
  const [newGig, setNewGig] = useState({
    title: '',
    description: '',
    budget: '',
    category: 'manual-labor',
    deadline: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location error:', error)
      );
    }
  }, []);

  // Fetch gigs with filters
  const fetchGigs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: filters.radius
      };
      
      // Remove empty values
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      
      const response = await gigAPI.searchGigs(params);
      setGigs(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching gigs:', error);
      alert('Failed to load gigs');
    } finally {
      setLoading(false);
    }
  }, [filters, userLocation]);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const handlePostGig = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newGig.title?.trim() || !newGig.description?.trim() || !newGig.budget) {
      setMessage('❌ Please fill in all required fields (Title, Description, Budget)');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (parseFloat(newGig.budget) < 10) {
      setMessage('❌ Budget must be at least ZMW 10');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setIsSubmitting(true);
      const gigData = {
        ...newGig,
        budget: Number(newGig.budget),
        location: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: 'UNZA Campus'
        }
      };

      await gigAPI.createGig(gigData);
      setShowPostModal(false);
      setNewGig({ title: '', description: '', budget: '', category: 'manual-labor', deadline: '' });
      setMessage('✅ Gig posted successfully! Your gig is now visible to workers.');
      setTimeout(() => setMessage(''), 3000);
      fetchGigs();
    } catch (error) {
      console.error('Error posting gig:', error);
      const errorMsg = error.response?.data?.error || error.message;
      setMessage('❌ Failed to post gig: ' + errorMsg);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyForGig = async (gigId) => {
    try {
      setLoading(true);
      await gigAPI.applyForGig(gigId, { message: 'I am interested in this gig' });
      setMessage('✅ Application submitted! The gig poster will review your application.');
      setTimeout(() => setMessage(''), 3000);
      fetchGigs();
    } catch (error) {
      console.error('Error applying for gig:', error);
      const errorMsg = error.response?.data?.error || error.message;
      if (errorMsg.includes('Already applied')) {
        setMessage('⚠️ You have already applied for this gig');
      } else {
        setMessage('❌ Failed to apply: ' + errorMsg);
      }
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'manual-labor',
    'academic',
    'design',
    'coding',
    'delivery',
    'other'
  ];

  return (
    <div className="gig-board-container">
      <div className="gig-board-header">
        <div className="header-content">
          <h1>💰 Smart Money Gigs</h1>
          <p>Find opportunities or post tasks in your area</p>
        </div>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => setShowPostModal(true)}
        >
          + Post a Gig
        </button>
      </div>

      {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div className="gig-board-content">
        {/* Map Section */}
        <div className="map-section">
          <div className="map-container">
            <MapContainer 
              center={[userLocation.lat, userLocation.lng]} 
              zoom={15} 
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Geofence Circle */}
              <Circle 
                center={[userLocation.lat, userLocation.lng]} 
                radius={filters.radius * 1000}
                pathOptions={{ color: '#8B5CF6', fillColor: '#8B5CF6', fillOpacity: 0.1 }}
              />

              {/* User Location */}
              <Marker 
                position={[userLocation.lat, userLocation.lng]}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>Your Location</Popup>
              </Marker>

              {/* Gig Markers */}
              {gigs.map(gig => (
                <Marker
                  key={gig._id}
                  position={[gig.location?.lat || -15.3941, gig.location?.lng || 28.3297]}
                  icon={gigIcon}
                  eventHandlers={{
                    click: () => setSelectedGig(gig)
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <h4>{gig.title}</h4>
                      <p className="budget">ZMW {gig.budget}</p>
                      <button 
                        className="btn btn-small btn-primary"
                        onClick={() => setSelectedGig(gig)}
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Filters and List Section */}
        <div className="gig-list-section">
          {/* Filters */}
          <div className="filters-card card">
            <h3>🔍 Find Gigs</h3>
            <div className="filter-grid">
              <div className="filter-item">
                <label>Search</label>
                <input 
                  type="text" 
                  placeholder="Search gigs..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="filter-input"
                />
              </div>

              <div className="filter-item">
                <label>Category</label>
                <select 
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="filter-input"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label>Min Budget (ZMW)</label>
                <input 
                  type="number" 
                  placeholder="Min"
                  value={filters.minBudget}
                  onChange={(e) => setFilters({...filters, minBudget: e.target.value})}
                  className="filter-input"
                />
              </div>

              <div className="filter-item">
                <label>Max Budget (ZMW)</label>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={filters.maxBudget}
                  onChange={(e) => setFilters({...filters, maxBudget: e.target.value})}
                  className="filter-input"
                />
              </div>

              <div className="filter-item">
                <label>Radius (km)</label>
                <input 
                  type="number" 
                  min="1"
                  max="50"
                  value={filters.radius}
                  onChange={(e) => setFilters({...filters, radius: e.target.value})}
                  className="filter-input"
                />
              </div>

              <div className="filter-item">
                <button 
                  className="btn btn-secondary btn-full"
                  onClick={fetchGigs}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Gigs List */}
          <div className="gigs-list">
            <h3>Available Gigs ({gigs.length})</h3>
            
            {loading ? (
              <div className="loading">Loading gigs...</div>
            ) : gigs.length > 0 ? (
              gigs.map(gig => (
                <div 
                  key={gig._id} 
                  className={`gig-card card ${selectedGig?._id === gig._id ? 'selected' : ''}`}
                  onClick={() => setSelectedGig(gig)}
                >
                  <div className="gig-header">
                    <h4>{gig.title}</h4>
                    <span className={`gig-category category-${gig.category}`}>
                      {gig.category}
                    </span>
                  </div>

                  <p className="gig-description">{gig.description.substring(0, 100)}...</p>

                  <div className="gig-info-row">
                    <div className="info-item">
                      <span className="label">Budget:</span>
                      <span className="value budget">ZMW {gig.budget}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Distance:</span>
                      <span className="value">{gig.distance?.toFixed(1) || '?'} km</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Applicants:</span>
                      <span className="value">{gig.applicants?.length || 0}</span>
                    </div>
                  </div>

                  <div className="gig-poster">
                    <img 
                      src={gig.posterId?.profileImage || 'https://via.placeholder.com/32'} 
                      alt={gig.posterId?.firstName}
                      className="poster-avatar"
                    />
                    <span>{gig.posterId?.firstName} {gig.posterId?.lastName}</span>
                  </div>

                  {currentUser && currentUser._id !== gig.posterId?._id && (
                    <button 
                      className="btn btn-primary btn-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyForGig(gig._id);
                      }}
                      disabled={loading}
                    >
                      {loading ? '⏳ Processing...' : '✅ Apply Now'}
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No gigs found in your area. Try adjusting your filters!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Gig Modal */}
      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Post a New Gig</h2>
              <button 
                className="close-btn"
                onClick={() => setShowPostModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostGig} className="gig-form">
              <div className="form-group">
                <label>Title *</label>
                <input 
                  type="text"
                  placeholder="e.g., Need website design"
                  value={newGig.title}
                  onChange={(e) => setNewGig({...newGig, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  placeholder="Describe the task in detail"
                  value={newGig.description}
                  onChange={(e) => setNewGig({...newGig, description: e.target.value})}
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget (ZMW) *</label>
                  <input 
                    type="number"
                    min="10"
                    placeholder="Amount"
                    value={newGig.budget}
                    onChange={(e) => setNewGig({...newGig, budget: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={newGig.category}
                    onChange={(e) => setNewGig({...newGig, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Deadline</label>
                <input 
                  type="datetime-local"
                  value={newGig.deadline}
                  onChange={(e) => setNewGig({...newGig, deadline: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : '✅ Post Gig'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gig Details Modal */}
      {selectedGig && !showPostModal && (
        <div className="modal-overlay" onClick={() => setSelectedGig(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedGig.title}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedGig(null)}
              >
                ✕
              </button>
            </div>

            <div className="gig-details">
              <div className="detail-row">
                <span className="label">Budget:</span>
                <span className="value budget">ZMW {selectedGig.budget}</span>
              </div>
              <div className="detail-row">
                <span className="label">Category:</span>
                <span className={`value category-${selectedGig.category}`}>{selectedGig.category}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`value status-${selectedGig.status}`}>{selectedGig.status}</span>
              </div>
              <div className="detail-row">
                <span className="label">Posted by:</span>
                <span className="value">{selectedGig.posterId?.firstName} {selectedGig.posterId?.lastName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Applicants:</span>
                <span className="value">{selectedGig.applicants?.length || 0}</span>
              </div>

              <div className="description">
                <h4>Description</h4>
                <p>{selectedGig.description}</p>
              </div>

              {currentUser && currentUser._id !== selectedGig.posterId?._id && selectedGig.status === 'open' && (
                <button 
                  className="btn btn-primary btn-lg btn-full"
                  onClick={() => {
                    handleApplyForGig(selectedGig._id);
                    setSelectedGig(null);
                  }}
                  disabled={loading}
                >
                  {loading ? '⏳ Processing...' : '✅ Apply for this Gig'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigBoard;
