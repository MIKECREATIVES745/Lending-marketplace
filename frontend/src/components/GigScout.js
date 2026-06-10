import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gigAPI, userAPI } from '../utils/api';
import '../styles/gig-scout.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for gigs and workers
const gigIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const workerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-cyan.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const GigScout = ({ currentUser, socket }) => {
  const [gigs, setGigs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [view, setView] = useState('gigs'); // 'gigs', 'workers', or 'dashboard'
  const [myGigs, setMyGigs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newGig, setNewGig] = useState({
    title: '',
    description: '',
    budget: '',
    category: 'academic',
    deadline: ''
  });

  const UNZA_COORDS = [-15.3941, 28.3297];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [gigRes, workerRes, myGigsRes, myJobsRes] = await Promise.all([
        gigAPI.getGigs(),
        userAPI.getGigWorkers(),
        gigAPI.getMyGigs(),
        gigAPI.getMyJobs()
      ]);
      // Handle different response structures
      const gigsData = Array.isArray(gigRes.data) ? gigRes.data : gigRes.data?.data || [];
      const workersData = Array.isArray(workerRes.data) ? workerRes.data : workerRes.data?.data || [];
      const myGigsData = Array.isArray(myGigsRes.data?.data) ? myGigsRes.data.data : Array.isArray(myGigsRes.data) ? myGigsRes.data : [];
      const myJobsData = Array.isArray(myJobsRes.data?.data) ? myJobsRes.data.data : Array.isArray(myJobsRes.data) ? myJobsRes.data : [];
      
      setGigs(gigsData);
      setWorkers(workersData);
      setMyGigs(myGigsData);
      setMyJobs(myJobsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('❌ Failed to load data. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time notification listener to alert user instantly
  useEffect(() => {
    const userId = currentUser?.id || currentUser?._id;
    if (!socket || !userId) return;

    socket.emit('join-user-room', userId);

    const handleNotification = (notif) => {
      // Play sound effect
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio error:', e));
      } catch (err) {}

      // Refresh data if notification is gig-related
      if (['GIG_APPLICATION', 'GIG_APPLICATION_ACCEPTED', 'GIG_CONFIRMATION', 'GIG_APPLICATION_DECLINED'].includes(notif.type)) {
        fetchData();
        // Show a local message/toast to alert user instantly on their current page
        setMessage(`🔔 ${notif.title}: ${notif.message}`);
        setTimeout(() => setMessage(''), 6000);
      }
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [socket, currentUser, fetchData]);

  const handlePostGig = async (e) => {
    e.preventDefault();
    if (!newGig.title || !newGig.description || !newGig.budget) {
      setMessage('❌ Please fill in all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setLoading(true);
      // Add current campus location to the gig
      const gigData = {
        ...newGig,
        budget: Number(newGig.budget),
        deadline: newGig.deadline ? new Date(newGig.deadline).toISOString() : null,
        location: {
          lat: UNZA_COORDS[0] + (Math.random() - 0.5) * 0.01, // Randomize slightly for demo
          lng: UNZA_COORDS[1] + (Math.random() - 0.5) * 0.01,
          address: 'UNZA Main Campus'
        }
      };
      await gigAPI.createGig(gigData);
      setShowPostModal(false);
      setNewGig({ title: '', description: '', budget: '', category: 'academic', deadline: '' });
      setMessage('✅ Gig posted successfully!');
      setTimeout(() => setMessage(''), 3000);
      fetchData();
    } catch (error) {
      console.error('Error posting gig:', error);
      setMessage('❌ Failed to post gig: ' + (error.response?.data?.error || error.message));
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (gigId) => {
    try {
      setLoading(true);
      await gigAPI.applyForGig(gigId, { message: 'I am interested in this gig' });
      setMessage('✅ Applied successfully!');
      setTimeout(() => setMessage(''), 3000);
      fetchData();
    } catch (error) {
      console.error('Error applying for gig:', error);
      setMessage('❌ Failed to apply: ' + (error.response?.data?.error || error.message));
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (gigId) => {
    try {
      await gigAPI.confirmGig(gigId);
      setMessage('✅ Confirmation recorded!');
      setTimeout(() => setMessage(''), 3000);
      fetchData();
    } catch (error) {
      console.error('Error confirming gig:', error);
      setMessage('❌ Failed to confirm: ' + (error.response?.data?.error || error.message));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Check if current user is the poster
  const userId = currentUser?.id || currentUser?._id;
  const isPoster = (poster) => {
    if (!userId || !poster) return false;
    const pId = typeof poster === 'string' ? poster : poster._id || poster.id;
    return String(userId) === String(pId);
  };

  const renderDashboard = () => (
    <div className="gig-dashboard">
      <div className="dashboard-section">
        <h3>My Posted Gigs (As Employer)</h3>
        {myGigs.length > 0 ? myGigs.map(gig => (
          <div key={gig._id} className="job-item card">
                {gig.status === 'in-progress' || gig.status === 'payment-pending' ? (
                  <div className="status-actions mt-2">
                    <p>Worker: {gig.assignedWorkerId?.firstName} {gig.assignedWorkerId?.lastName}</p>
                    <p>📞 Contact: {gig.assignedWorkerId?.phone || 'No phone'} | 📧 {gig.assignedWorkerId?.email}</p>
                    {!gig.posterConfirmation && (
                      <button className="btn btn-primary btn-small" onClick={() => handleConfirm(gig._id)}>Confirm Completion & Release Payment</button>
                    )}
                    {gig.posterConfirmation && <p className="text-success">✓ You have confirmed completion</p>}
                    {gig.status === 'payment-pending' && !gig.posterConfirmation && (
                      <p className="text-warning mt-2">Worker has marked as complete. Please verify and confirm.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )) : <p>No gigs posted yet.</p>}
      </div>

      <div className="dashboard-section mt-4">
        <h3>My Active Jobs (As Worker)</h3>
        {myJobs.length > 0 ? myJobs.map(job => (
          <div key={job._id} className="job-item card">
            <div className={`job-status ${job.status === 'completed' ? 'green' : 'blue'}`}>{job.status.toUpperCase()}</div>
            <div className="job-main">
              <div className="job-info">
                <h4>{job.title}</h4>
                <p>Client: {job.posterId?.firstName} {job.posterId?.lastName}</p>
                <p>📞 Contact: {job.posterId?.phone || 'No phone'} | 📧 {job.posterId?.email}</p>
                <p>Budget: ZMW {job.budget} | Escrow: {job.escrowStatus}</p>
                {(job.status === 'in-progress' || job.status === 'payment-pending') && !job.workerConfirmation && (
                  <button className="btn btn-primary btn-small mt-2" onClick={() => handleConfirm(job._id)}>Mark as Completed</button>
                )}
                {job.workerConfirmation && <p className="text-success mt-2">✓ You have marked this as completed</p>}
              </div>
            </div>
          </div>
        )) : <p>No active jobs found.</p>}
      </div>
    </div>
  );

  return (
    <div className="gig-scout-page">
      <div className="gig-map-container">
        <MapContainer center={UNZA_COORDS} zoom={15} scrollWheelZoom={false} style={{ height: '400px', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle center={UNZA_COORDS} radius={1000} pathOptions={{ color: '#5B21B6', fillColor: '#5B21B6', fillOpacity: 0.1 }} />

          {/* Gig Markers */}
          {gigs.map(gig => (
            <Marker
              key={gig._id}
              position={[gig.location?.lat || UNZA_COORDS[0], gig.location?.lng || UNZA_COORDS[1]]}
              icon={gigIcon}
            >
              <Popup>
                <div className="map-popup">
                  <h4>{gig.title}</h4>
                  <p>Budget: ZMW {gig.budget}</p>
                  {!isPoster(gig.posterId) && (
                    <button className="btn btn-small btn-primary" onClick={() => handleApply(gig._id)}>Apply</button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Worker Markers */}
          {workers.map(worker => (
            <Marker
              key={worker._id}
              position={[worker.location?.lat || UNZA_COORDS[0], worker.location?.lng || UNZA_COORDS[1]]}
              icon={workerIcon}
            >
              <Popup>
                <div className="map-popup">
                  <h4>{worker.firstName} {worker.lastName}</h4>
                  <p>{worker.gigBio || 'Gig Worker'}</p>
                  <p>Skills: {worker.gigSkills?.join(', ') || 'N/A'}</p>
                  <button className="btn btn-small btn-secondary">Contact Worker</button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="map-legend">
          <span className="legend-item"><span className="dot gig-dot"></span> Gigs</span>
          <span className="legend-item"><span className="dot worker-dot"></span> Workers</span>
        </div>
      </div>

      <div className="job-board container">
        <div className="handle-bar"></div>
        <div className="job-board-header">
          <div className="view-toggle">
            <button className={`toggle-btn ${view === 'gigs' ? 'active' : ''}`} onClick={() => setView('gigs')}>Gigs</button>
            <button className={`toggle-btn ${view === 'workers' ? 'active' : ''}`} onClick={() => setView('workers')}>Workers</button>
            <button className={`toggle-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>My Gigs</button>
          </div>
          <button className="btn btn-primary btn-small" onClick={() => setShowPostModal(true)}>Post a Gig</button>
        </div>

        {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}

        {loading ? (
          <div className="loading-state">Scanning campus for opportunities...</div>
        ) : (
          <div className="job-list mt-3">
            {view === 'dashboard' ? (
              renderDashboard()
            ) : view === 'gigs' ? (
              gigs.length > 0 ? gigs.map(gig => (
                <div key={gig._id} className="job-item card">
                  <div className="job-status green">On-Campus/Verified</div>
                  <div className="job-main">
                    <div className="job-info">
                      <h4>{gig.title}</h4>
                      <p className="job-desc">{gig.description}</p>
                      <p className="job-price">ZMW {gig.budget}</p>
                      <p className="job-applicants">{gig.applicants?.length || 0} applicants</p>
                    </div>

                    {/* Direct link to management if it's the poster's own gig */}
                    {isPoster(gig.posterId) && (
                      <button 
                        className="btn btn-small btn-outline-primary mb-2"
                        onClick={() => setView('dashboard')}
                      >
                        Manage Applications
                      </button>
                    )}

                    {!isPoster(gig.posterId) && (
                      <button
                        className="btn btn-dark"
                        onClick={() => handleApply(gig._id)}
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="empty-state">No open gigs found. Be the first to post one!</div>
              )
            ) : (
              workers.length > 0 ? workers.map(worker => (
                <div key={worker._id} className="job-item card worker-item">
                  <div className="job-main">
                    <div className="worker-avatar">
                      {worker.profileImage ? <img src={worker.profileImage} alt={worker.firstName} /> : <span>{worker.firstName[0]}</span>}
                    </div>
                    <div className="job-info">
                      <h4>{worker.firstName} {worker.lastName}</h4>
                      <p className="worker-skills">{worker.gigSkills?.join(' • ')}</p>
                      <p className="worker-bio">{worker.gigBio}</p>
                      <div className="worker-stats">
                        <span className="rating">⭐ {worker.gigRating || 0}</span>
                      </div>
                    </div>
                    <button className="btn btn-outline">Hire Worker</button>
                  </div>
                </div>
              )) : (
                <div className="empty-state">No gig workers found nearby.</div>
              )
            )}
          </div>
        )}
      </div>

      {showPostModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h2>Post a New Gig</h2>
            <form onSubmit={handlePostGig}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  required
                  value={newGig.title}
                  onChange={e => setNewGig({...newGig, title: e.target.value})}
                  placeholder="e.g. Assignment Help, Graphic Design"
                />
              </div>
              <div className="form-group mt-2">
                <label>Description</label>
                <textarea
                  required
                  value={newGig.description}
                  onChange={e => setNewGig({...newGig, description: e.target.value})}
                  placeholder="Explain what needs to be done..."
                />
              </div>
              <div className="grid mt-2">
                <div className="form-group">
                  <label>Budget (ZMW)</label>
                  <input
                    type="number"
                    required
                    value={newGig.budget}
                    onChange={e => setNewGig({...newGig, budget: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newGig.category}
                    onChange={e => setNewGig({...newGig, category: e.target.value})}
                  >
                    <option value="academic">Academic</option>
                    <option value="design">Design</option>
                    <option value="coding">Coding</option>
                    <option value="delivery">Delivery</option>
                    <option value="manual-labor">Manual Labor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowPostModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Gig</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigScout;
