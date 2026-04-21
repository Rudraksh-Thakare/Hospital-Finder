import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// Hospitals
export const hospitalAPI = {
  getAll: (params) => api.get('/hospitals', { params }),
  getById: (id) => api.get(`/hospitals/${id}`),
  getMyProfile: () => api.get('/hospitals/my/profile'),
  create: (data) => api.post('/hospitals', data),
  update: (id, data) => api.put(`/hospitals/${id}`, data),
  delete: (id) => api.delete(`/hospitals/${id}`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/hospitals/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getSlots: (id, date) => api.get(`/hospitals/${id}/slots/${date}`),
  publishSlots: (id, data) => api.post(`/hospitals/${id}/slots`, data),
  deleteSlot: (id, slotId) => api.delete(`/hospitals/${id}/slots/${slotId}`),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getHospitals: () => api.get('/admin/hospitals'),
  verifyHospital: (id) => api.patch(`/admin/hospitals/${id}/verify`),
  deleteHospital: (id) => api.delete(`/admin/hospitals/${id}`),
};

// User
export const userAPI = {
  getMe: () => api.get('/users/me'),
};

// Appointments
export const appointmentAPI = {
  book: (data) => api.post('/appointments', data),
  getAvailableSlots: (hospitalId, date) => api.get('/appointments/slots', { params: { hospitalId, date } }),
  getMyAppointments: () => api.get('/appointments/my-appointments'),
  getHospitalAppointments: () => api.get('/appointments/hospital-appointments'),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
};

export default api;
