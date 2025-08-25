// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, full_name: string) => 
    api.post('/auth/register', { email, password, full_name }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => 
    api.post('/auth/reset-password', { token, password })
};

export const usersAPI = {
  getUsers: (skip = 0, limit = 100, filters = {}) => 
    api.get(`/users?skip=${skip}&limit=${limit}`, { params: filters }),
  getUser: (userId: number) => 
    api.get(`/users/${userId}`),
  updateUser: (userId: number, data: any) => 
    api.put(`/users/${userId}`, data),
  uploadProfilePicture: (userId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/users/${userId}/profile-picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAccount: (userId: number) => 
    api.delete(`/users/${userId}`),
  changePassword: (userId: number, currentPassword: string, newPassword: string) => 
    api.post(`/users/${userId}/change-password`, { currentPassword, newPassword })
};

export const matchingAPI = {
  getMatches: (userId: number, filters?: any) => 
    api.get(`/matches/${userId}`, { params: filters }),
  likeUser: (userId: number, targetUserId: number) => 
    api.post(`/matches/${userId}/like/${targetUserId}`),
  dislikeUser: (userId: number, targetUserId: number) => 
    api.post(`/matches/${userId}/dislike/${targetUserId}`),
  getMutualMatches: (userId: number) => 
    api.get(`/matches/${userId}/mutual`),
  getPotentialMatches: (userId: number, limit = 10) => 
    api.get(`/matches/${userId}/potential?limit=${limit}`),
  unmatch: (userId: number, targetUserId: number) => 
    api.delete(`/matches/${userId}/unmatch/${targetUserId}`)
};

export const journalAPI = {
  getEntries: (userId: number) => 
    api.get(`/journal/${userId}`),
  createEntry: (userId: number, data: { content: string; mood: string }) => 
    api.post(`/journal/${userId}`, data),
  updateEntry: (userId: number, entryId: number, data: { content?: string; mood?: string }) => 
    api.put(`/journal/${userId}/entries/${entryId}`, data),
  deleteEntry: (userId: number, entryId: number) => 
    api.delete(`/journal/${userId}/entries/${entryId}`),
  getAnalysis: (userId: number) => 
    api.get(`/journal/${userId}/analysis`),
  getInsights: (userId: number, timeframe: string = 'month') => 
    api.get(`/journal/${userId}/insights?timeframe=${timeframe}`)
};

export const analysisAPI = {
  analyzeText: (text: string, userId: number) => 
    api.post('/analyze/text', { text, user_id: userId }),
  uploadVoice: (userId: number, audioFile: File) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    return api.post(`/users/${userId}/voice-analysis`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getPersonalityTraits: (userId: number) => 
    api.get(`/analysis/${userId}/personality`),
  getCommunicationStyle: (userId: number) => 
    api.get(`/analysis/${userId}/communication`),
  getCompatibility: (userId: number, targetUserId: number) => 
    api.get(`/analysis/compatibility/${userId}/${targetUserId}`)
};

export const chatAPI = {
  getChatHistory: (sessionId: string) => 
    api.get(`/chat/${sessionId}/history`),
  createChatSession: (userId: number, targetUserId: number) => 
    api.post('/chat/sessions', { user_id: userId, target_user_id: targetUserId }),
  getChatSessions: (userId: number) => 
    api.get(`/chat/user/${userId}/sessions`),
  markAsRead: (sessionId: string, messageIds: string[]) => 
    api.post(`/chat/${sessionId}/read`, { message_ids: messageIds }),
  sendTypingIndicator: (sessionId: string, isTyping: boolean) => 
    api.post(`/chat/${sessionId}/typing`, { is_typing: isTyping }),
  deleteChatSession: (sessionId: string) => 
    api.delete(`/chat/sessions/${sessionId}`),
  clearChatHistory: (sessionId: string) => 
    api.delete(`/chat/${sessionId}/history`)
};

export const voiceAPI = {
  startRecordingSession: (userId: number) => 
    api.post('/voice/session', { user_id: userId }),
  uploadAudioChunk: (sessionId: string, chunk: Blob, index: number) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('index', index.toString());
    return api.post(`/voice/${sessionId}/chunk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  completeRecording: (sessionId: string) => 
    api.post(`/voice/${sessionId}/complete`),
  getAnalysis: (sessionId: string) => 
    api.get(`/voice/${sessionId}/analysis`),
  getRecording: (sessionId: string) => 
    api.get(`/voice/${sessionId}/recording`, { responseType: 'blob' })
};

export const notificationsAPI = {
  getNotifications: (userId: number) => 
    api.get(`/notifications/${userId}`),
  markAsRead: (userId: number, notificationId: string) => 
    api.put(`/notifications/${userId}/read/${notificationId}`),
  markAllAsRead: (userId: number) => 
    api.put(`/notifications/${userId}/read-all`),
  deleteNotification: (userId: number, notificationId: string) => 
    api.delete(`/notifications/${userId}/${notificationId}`),
  getUnreadCount: (userId: number) => 
    api.get(`/notifications/${userId}/unread-count`)
};

export const profileAPI = {
  validateUsername: (username: string) => 
    api.get('/profile/validate-username', { params: { username } }),
  searchInterests: (query: string) => 
    api.get('/profile/interests/search', { params: { q: query } }),
  getSuggestedInterests: () => 
    api.get('/profile/interests/suggested'),
  getPopularInterests: () => 
    api.get('/profile/interests/popular')
};

export default api;