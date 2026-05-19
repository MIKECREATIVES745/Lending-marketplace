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

const GigScout = ({ currentUser }) => {
  const [gigs, setGigs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [view, setView] = useState('gigs'); // 'gigs', 'workers', or 'dashboard'
  const [myGigs, setMyGigs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(true);
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
      setGigs(gigRes.data);
      setWorkers(workerRes.data);
      setMyGigs(myGigsRes.data);
      setMyJobs(myJobsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePostGig = async (e) => {
    e.preventDefault();
    try {
      // Add current campus location to the gig
      const gigData = {
        ...newGig,
        location: {
          lat: UNZA_COORDS[0] + (Math.random() - 0.5) * 0.01, // Randomize slightly for demo
          lng: UNZA_COORDS[1] + (Math.random() - 0.5) * 0.01,
          address: 'UNZA Main Campus'
        }
      };
      await gigAPI.createGig(gigData);
      setShowPostModal(false);
      setNewGig({ title: '', description: '', budget: '', category: 'academic', deadline: '' });
      fetchData();
      alert('Gig posted successfully!');
    } catch (error) {
      console.error('Error posting gig:', error);
      alert('Failed to post gig.');
    }
  };

  const handleConfirm = async (gigId) => {
    try {
      await gigAPI.confirmGig(gigId);
      alert('Confirmation recorded!');
      fetchData();
    } catch (error) {
      alert('Failed to confirm completion.');
    }
  };

  const handleHire = async (gigId, workerId) => {
    try {
      await gigAPI.hireWorker(gigId, workerId);
      alert('Worker hired! Escrow initiated.');
      fetchData();
    } catch (error) {
      alert('Failed to hire worker.');
    }
  };

  const renderDashboard = () => (
    <div className="gig-dashboard">
      <div className="dashboard-section">
        <h3>My Posted Gigs (As Employer)</h3>
        {myGigs.length > 0 ? myGigs.map(gig => (
          <div key={gig._id} className="job-item card">
            <div className={`job-status ${gig.status === 'completed' ? 'green' : 'blue'}`}>{gig.status.toUpperCase()}</div>
            <div className="job-main">
              <div className="job-info">
                <h4>{gig.title}</h4>
                <p>Budget: ZMW {gig.budget} | Escrow: {gig.escrowStatus}</p>
                {gig.status === 'open' && (
                  <div className="applicants-list mt-2">
                    <h5>Applicants ({gig.applicants?.length || 0}):</h5>
                    {gig.applicants?.map(app => (
                      <div key={app.userId._id} className="applicant-item">
                        <span>{app.userId.firstName} {app.userId.lastName}</span>
                        <button className="btn btn-small btn-primary" onClick={() => handleHire(gig._id, app.userId._id)}>Hire</button>
                      </div>
                    ))}
                  </div>
                )}
                {gig.status === 'in-progress' || gig.status === 'payment-pending' ? (
                  <div className="status-actions mt-2">
                    <p>Worker: {gig.assignedWorkerId?.firstName} {gig.assignedWorkerId?.lastName}</p>
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
                  <button className="btn btn-small btn-primary" onClick={() => handleApply(gig._id)}>Apply</button>
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
                    <button
                      className="btn btn-dark"
                      onClick={() => handleApply(gig._id)}
                    >
                      Apply Now
                    </button>
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
