import api from './api';

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, data) => api.put(`/bookings/${id}/cancel`, data),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  getProfessionalBookings: (params) => api.get('/bookings/professional-bookings', { params }),
  getAvailableSlots: (params) => api.get('/bookings/available-slots', { params }),
};

export const professionalService = {
  getAll: (params) => api.get('/professionals', { params }),
  getById: (id) => api.get(`/professionals/${id}`),
  getByService: (serviceId) => api.get(`/professionals/by-service/${serviceId}`),
  getMyProfile: () => api.get('/professionals/my-profile'),
  updateProfile: (data) => api.put('/professionals/profile', data),
  updateAvailability: (data) => api.put('/professionals/availability', data),
};

export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getByProfessional: (id, params) => api.get(`/reviews/${id}`, { params }),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getProfessionals: (params) => api.get('/admin/professionals', { params }),
  getRevenue: () => api.get('/admin/revenue'),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  verifyProfessional: (id, data) => api.put(`/admin/professionals/${id}/verify`, data),
};
