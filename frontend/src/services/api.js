import axios from 'axios';

// Configuração base do Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de Autenticação
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/api/auth/profile', userData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/api/auth/password', passwordData);
    return response.data;
  },
};

// Serviços de Questões
export const questionsService = {
  getQuestions: async (params = {}) => {
    const response = await api.get('/api/questions', { params });
    return response.data;
  },

  getQuestion: async (id) => {
    const response = await api.get(`/api/questions/${id}`);
    return response.data;
  },

  createQuestion: async (questionData) => {
    const response = await api.post('/api/questions', questionData);
    return response.data;
  },

  updateQuestion: async (id, questionData) => {
    const response = await api.put(`/api/questions/${id}`, questionData);
    return response.data;
  },

  deleteQuestion: async (id) => {
    const response = await api.delete(`/api/questions/${id}`);
    return response.data;
  },

  voteQuestion: async (id, voteType) => {
    const response = await api.post(`/api/questions/${id}/vote`, { vote_type: voteType });
    return response.data;
  },

  getAnswers: async (questionId) => {
    const response = await api.get(`/api/questions/${questionId}/answers`);
    return response.data;
  },

  createAnswer: async (questionId, answerData) => {
    const response = await api.post(`/api/questions/${questionId}/answers`, answerData);
    return response.data;
  },

  voteAnswer: async (answerId, voteType) => {
    const response = await api.post(`/api/answers/${answerId}/vote`, { vote_type: voteType });
    return response.data;
  },
};

// Serviços de Connect (Feed Social)
export const connectService = {
  getPosts: async (params = {}) => {
    const response = await api.get('/api/connect/posts', { params });
    return response.data;
  },

  createPost: async (postData) => {
    const response = await api.post('/api/connect/posts', postData);
    return response.data;
  },

  updatePost: async (id, postData) => {
    const response = await api.put(`/api/connect/posts/${id}`, postData);
    return response.data;
  },

  deletePost: async (id) => {
    const response = await api.delete(`/api/connect/posts/${id}`);
    return response.data;
  },

  likePost: async (id) => {
    const response = await api.post(`/api/connect/posts/${id}/like`);
    return response.data;
  },

  getComments: async (postId) => {
    const response = await api.get(`/api/connect/posts/${postId}/comments`);
    return response.data;
  },

  createComment: async (postId, commentData) => {
    const response = await api.post(`/api/connect/posts/${postId}/comments`, commentData);
    return response.data;
  },

  likeComment: async (commentId) => {
    const response = await api.post(`/api/connect/comments/${commentId}/like`);
    return response.data;
  },

  getFeaturedPortfolios: async () => {
    const response = await api.get('/api/connect/portfolios/featured');
    return response.data;
  },

  submitPortfolio: async (portfolioData) => {
    const response = await api.post('/api/connect/portfolios/submit', portfolioData);
    return response.data;
  },

  votePortfolio: async (portfolioId) => {
    const response = await api.post(`/api/connect/portfolios/${portfolioId}/vote`);
    return response.data;
  },
};

// Serviços de Portfolio
export const portfolioService = {
  getUserPortfolio: async (userId) => {
    const response = await api.get(`/api/portfolio/${userId}`);
    return response.data;
  },

  updatePortfolio: async (portfolioData) => {
    const response = await api.put('/api/portfolio', portfolioData);
    return response.data;
  },

  uploadImage: async (formData) => {
    const response = await api.post('/api/portfolio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Serviços de Loja PCon
export const storeService = {
  getStoreItems: async (params = {}) => {
    const response = await api.get('/api/store/items', { params });
    return response.data;
  },

  getStoreItem: async (id) => {
    const response = await api.get(`/api/store/items/${id}`);
    return response.data;
  },

  purchaseItem: async (itemId, quantity = 1) => {
    const response = await api.post(`/api/store/items/${itemId}/purchase`, { quantity });
    return response.data;
  },

  getUserInventory: async () => {
    const response = await api.get('/api/store/inventory');
    return response.data;
  },

  getPurchaseHistory: async () => {
    const response = await api.get('/api/store/purchases');
    return response.data;
  },
};

// Serviços de Vagas B2B
export const jobsService = {
  getJobs: async (params = {}) => {
    const response = await api.get('/api/jobs', { params });
    return response.data;
  },

  getJob: async (id) => {
    const response = await api.get(`/api/jobs/${id}`);
    return response.data;
  },

  createJob: async (jobData) => {
    const response = await api.post('/api/jobs', jobData);
    return response.data;
  },

  updateJob: async (id, jobData) => {
    const response = await api.put(`/api/jobs/${id}`, jobData);
    return response.data;
  },

  deleteJob: async (id) => {
    const response = await api.delete(`/api/jobs/${id}`);
    return response.data;
  },

  applyToJob: async (jobId, applicationData) => {
    const response = await api.post(`/api/jobs/${jobId}/apply`, applicationData);
    return response.data;
  },

  getJobApplications: async (jobId) => {
    const response = await api.get(`/api/jobs/${jobId}/applications`);
    return response.data;
  },

  getUserApplications: async () => {
    const response = await api.get('/api/jobs/applications');
    return response.data;
  },
};

// Serviços de Artigos
export const articlesService = {
  getArticles: async (params = {}) => {
    const response = await api.get('/api/articles', { params });
    return response.data;
  },

  getArticle: async (id) => {
    const response = await api.get(`/api/articles/${id}`);
    return response.data;
  },

  createArticle: async (articleData) => {
    const response = await api.post('/api/articles', articleData);
    return response.data;
  },

  updateArticle: async (id, articleData) => {
    const response = await api.put(`/api/articles/${id}`, articleData);
    return response.data;
  },

  deleteArticle: async (id) => {
    const response = await api.delete(`/api/articles/${id}`);
    return response.data;
  },

  upvoteArticle: async (id) => {
    const response = await api.post(`/api/articles/${id}/upvote`);
    return response.data;
  },
};

// Serviços de Admin
export const adminService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  updateUserRole: async (userId, roleData) => {
    const response = await api.put(`/api/admin/users/${userId}/role`, roleData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  getSystemStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  seedStoreItems: async () => {
    const response = await api.post('/api/admin/store/seed');
    return response.data;
  },
};

export default api;
