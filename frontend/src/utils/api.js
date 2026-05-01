import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
  login: (credentials) => api.post('/auth/login', credentials)
};

// User APIs
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
  getLenders: () => api.get('/users/lenders/list')
};

// Loan APIs
export const loanAPI = {
  createLoan: (loanData) => api.post('/loans', loanData),
  getUserLoans: (userId) => api.get(`/loans/user/${userId}`),
  getLoan: (loanId) => api.get(`/loans/${loanId}`),
  acceptLoan: (loanId, data) => api.put(`/loans/${loanId}/accept`, data),
  recordPayment: (loanId, data) => api.post(`/loans/${loanId}/payment`, data)
};

// Marketplace APIs
export const marketplaceAPI = {
  getAvailableLoans: (filters) => api.get('/marketplace/available-loans', { params: filters }),
  getAvailableLenders: () => api.get('/marketplace/available-lenders'),
  getLenderDetails: (lenderId) => api.get(`/marketplace/lenders/${lenderId}`)
};

// Collateral APIs
export const collateralAPI = {
  addCollateral: (data) => api.post('/collateral', data),
  getUserCollateral: (userId) => api.get(`/collateral/user/${userId}`),
  updateCollateral: (collateralId, data) => api.put(`/collateral/${collateralId}`, data),
  deleteCollateral: (collateralId) => api.delete(`/collateral/${collateralId}`)
};

// Chat APIs
export const chatAPI = {
  getConversations: (userId) => api.get(`/chat/conversations/${userId}`),
  getMessages: (conversationId) => api.get(`/chat/messages/${conversationId}`),
  createConversation: (data) => api.post('/chat/conversation', data),
  sendMessage: (data) => api.post('/chat/message', data)
};

export default api;
