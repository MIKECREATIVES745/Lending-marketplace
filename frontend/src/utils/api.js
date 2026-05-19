import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  getGigWorkers: () => api.get('/users/workers/list')
};

// Loan APIs
export const loanAPI = {
  createLoan: (loanData) => api.post('/loans', loanData),
  getUserLoans: (userId) => api.get(`/loans/user/${userId}`),
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

// Gig APIs
export const gigAPI = {
  getGigs: (category) => api.get('/gigs', { params: { category } }),
  createGig: (data) => api.post('/gigs', data),
  applyForGig: (gigId, data) => api.post(`/gigs/${gigId}/apply`, data),
  getMyGigs: () => api.get('/gigs/my-posts'),
  getMyJobs: () => api.get('/gigs/my-jobs'),
  hireWorker: (gigId, workerId) => api.post(`/gigs/${gigId}/hire`, { workerId }),
  confirmGig: (gigId) => api.post(`/gigs/${gigId}/confirm`)
};

export default api;
