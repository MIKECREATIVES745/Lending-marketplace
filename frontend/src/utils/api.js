import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://smartmoney-h0wa.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyEmail: (data) => api.post('/auth/verify-email', data)
};

// User APIs
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
  getLenders: () => api.get('/users/lenders/list'),
  getBorrowers: () => api.get('/users/borrowers/list'),
  getGigWorkers: () => api.get('/users/workers/list'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// Loan APIs
export const loanAPI = {
  createLoan: (loanData) => api.post('/loans', loanData),
  applyForBcLoan: (data) => api.post('/loans/bc-apply', data),
  getUserLoans: (userId) => api.get(`/loans/user/${userId}`),
  approveBcLoan: (loanId) => api.post(`/loans/${loanId}/approve-bc`), // New API for admin approval
  getLoan: (loanId) => api.get(`/loans/${loanId}`),
  acceptLoan: (loanId, data) => api.put(`/loans/${loanId}/accept`, data),
  recordPayment: (loanId, data) => api.post(`/loans/${loanId}/payment`, data),
  getQRCode: (loanId) => api.get(`/loans/${loanId}/qrcode`),
  verifyExchange: (loanId, code) => api.post(`/loans/${loanId}/verify-exchange`, { verificationCode: code })
};

// Marketplace APIs
export const marketplaceAPI = {
  getAvailableLoans: (filters) => api.get('/marketplace/available-loans', { params: filters }),
  getAvailableLenders: () => api.get('/marketplace/available-lenders'),
  getLenderDetails: (lenderId) => api.get(`/marketplace/lenders/${lenderId}`)
};

// Collateral APIs
export const collateralAPI = {
  addCollateral: (data) => {
    // If files are included, use FormData
    if (data instanceof FormData) {
      return api.post('/collateral', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.post('/collateral', data);
  },
  getUserCollateral: (userId) => api.get(`/collateral/user/${userId}`),
  getCollateral: (collateralId) => api.get(`/collateral/${collateralId}`),
  updateCollateral: (collateralId, data) => {
    // If files are included, use FormData
    if (data instanceof FormData) {
      return api.put(`/collateral/${collateralId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.put(`/collateral/${collateralId}`, data);
  },
  deleteCollateral: (collateralId) => api.delete(`/collateral/${collateralId}`)
};

// Chat APIs
export const chatAPI = {
  getConversations: (userId) => api.get(`/chat/conversations/${userId}`),
  getMessages: (conversationId) => api.get(`/chat/messages/${conversationId}`),
  createConversation: (data) => api.post('/chat/conversation', data),
  sendMessage: (data) => api.post('/chat/message', data)
};

// Lending APIs
export const lendingAPI = {
  getLendingOffers: () => api.get('/lending'),
  getLendingOffer: (offerId) => api.get(`/lending/${offerId}`),
  createLendingOffer: (data) => api.post('/lending', data),
  getMyOffers: () => api.get('/lending/my-offers/list'),
  updateLendingOffer: (offerId, data) => api.put(`/lending/${offerId}`, data),
  deleteLendingOffer: (offerId) => api.delete(`/lending/${offerId}`),
  applyForOffer: (offerId) => api.post(`/lending/${offerId}/apply`),
  updateApplicationStatus: (offerId, borrowerId, status) => api.patch(`/lending/${offerId}/applications/${borrowerId}/status`, { status })
};

// Gig APIs
export const gigAPI = {
  getGigs: (params = {}) => api.get('/gigs', { params }),
  getGigById: (gigId) => api.get(`/gigs/${gigId}`),
  searchGigs: (filters) => api.get('/gigs', { params: filters }), // Enhanced search with filters
  createGig: (data) => api.post('/gigs', data),
  applyForGig: (gigId, data) => api.post(`/gigs/${gigId}/apply`, data),
  getMyGigs: () => api.get('/gigs/my-posts'),
  getMyJobs: () => api.get('/gigs/my-jobs'),
  hireWorker: (gigId, workerId) => api.post(`/gigs/${gigId}/hire`, { workerId }),
  confirmGig: (gigId) => api.post(`/gigs/${gigId}/confirm`),
  declineApplication: (gigId, applicantId) => api.post(`/gigs/${gigId}/applicants/${applicantId}/decline`),
  getAdminGigApplications: () => api.get('/gigs/admin/applications')
};

// Site Content APIs
export const siteContentAPI = {
  getAllContent: () => api.get('/sitecontent'),
  getContent: (contentType) => api.get(`/sitecontent/${contentType}`),
  updateContent: (contentType, data) => api.put(`/sitecontent/${contentType}`, data)
};

export const adminAPI = {
  getSummary: (params = {}) => api.get('/admin/summary', { params }),
  getTransactions: (params = {}) => api.get('/admin/transactions', { params }),
  getBcApplications: () => api.get('/admin/bc-applications')
};

export default api;
