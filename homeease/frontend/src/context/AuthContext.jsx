import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('homeease_token');
    const storedUser = localStorage.getItem('homeease_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Listen for unauthorized events from the API interceptor
    const handleUnauthorized = () => {
      setUser(null);
      navigate('/login');
    };
    window.addEventListener('homeease:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('homeease:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    try {
      const { data } = await authService.login(credentials);
      localStorage.setItem('homeease_token', data.token);
      localStorage.setItem('homeease_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true, user: data.user };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await authService.register(userData);
      localStorage.setItem('homeease_token', data.token);
      localStorage.setItem('homeease_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success('Registration successful! Welcome to HomeEase!');
      return { success: true, user: data.user };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('homeease_token');
    localStorage.removeItem('homeease_user');
    setUser(null);
    toast.info('You have been logged out');
  };

  const updateUserState = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem('homeease_user', JSON.stringify(merged));
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserState, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
