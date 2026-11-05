import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // If already logged in, redirect away from login page
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'professional') navigate('/professional/dashboard', { replace: true });
      else navigate(from === '/login' ? '/' : from, { replace: true });
    }
  }, [isAuthenticated]);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    const result = await login(form);
    setLoading(false);

    if (result.success) {
      if (result.user.role === 'admin') navigate('/admin');
      else if (result.user.role === 'professional') navigate('/professional/dashboard');
      else navigate(from);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="auth-logo">🏠 HomeEase</Link>
          <h2>Welcome Back!</h2>
          <p>Sign in to manage your bookings, track services, and connect with trusted professionals.</p>
          <div className="auth-features">
            <div className="auth-feature">✅ Verified Professionals</div>
            <div className="auth-feature">✅ Secure Bookings</div>
            <div className="auth-feature">✅ Satisfaction Guarantee</div>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=70"
          alt="Home services"
          className="auth-image"
        />
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>Sign In</h1>
            <p>Don't have an account? <Link to="/register">Create one</Link></p>
          </div>

          {/* Demo credentials notice */}
          <div className="demo-notice">
            <strong>Demo Credentials:</strong><br />
            Admin: admin@homeease.com / password123<br />
            Customer: john@homeease.com / password123
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: '' })); }}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Password
                <Link to="/forgot-password" className="forgot-link" tabIndex={-1}>Forgot password?</Link>
              </label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: '' })); }}
                  autoComplete="current-password"
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : <LogIn size={18} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-text">
            By continuing you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
