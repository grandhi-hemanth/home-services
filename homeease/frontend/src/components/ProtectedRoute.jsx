import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'professional') return <Navigate to="/professional/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
