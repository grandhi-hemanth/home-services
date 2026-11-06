import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('homeease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
// Only redirect to login on 401 for auth/me and protected non-booking routes.
// Never redirect mid-booking — let the component handle the error itself.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isBookingOrPayment =
      url.includes('/bookings') ||
      url.includes('/reviews') ||
      url.includes('/professionals');

    if (error.response?.status === 401 && !isBookingOrPayment) {
      localStorage.removeItem('homeease_token');
      localStorage.removeItem('homeease_user');
      // Use React Router navigation instead of hard reload to preserve state
      window.dispatchEvent(new CustomEvent('homeease:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
