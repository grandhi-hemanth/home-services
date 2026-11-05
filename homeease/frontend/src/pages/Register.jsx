import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect away
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'professional') navigate('/professional/dashboard', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [isAuthenticated]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    const result = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role });
    setLoading(false);

    if (result.success) {
      if (result.user.role === 'professional') navigate('/professional/dashboard');
      else navigate('/');
    }
  };

  const update = (key, value) => { setForm((p) => ({ ...p, [key]: value })); setErrors((p) => ({ ...p, [key]: '' })); };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="auth-logo">🏠 HomeEase</Link>
          <h2>Join HomeEase Today</h2>
          <p>Create your account and start booking trusted home service professionals in minutes.</p>
          <div className="auth-features">
            <div className="auth-feature">✅ Free to Register</div>
            <div className="auth-feature">✅ 500+ Verified Professionals</div>
            <div className="auth-feature">✅ Book in 2 Minutes</div>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=70"
          alt="Join HomeEase"
          className="auth-image"
        />
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>Create Account</h1>
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>

          {/* Role Selection */}
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${form.role === 'customer' ? 'active' : ''}`}
              onClick={() => update('role', 'customer')}
            >
              <User size={18} /> I need services
            </button>
            <button
              type="button"
              className={`role-btn ${form.role === 'professional' ? 'active' : ''}`}
              onClick={() => update('role', 'professional')}
            >
              <Briefcase size={18} /> I'm a professional
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input type="text" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="John Smith" value={form.name} onChange={(e) => update('name', e.target.value)} autoComplete="name" />
              </div>
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="your@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input type="tel" className="form-input" placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => update('phone', e.target.value)} autoComplete="tel" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input type={showPassword ? 'text' : 'password'} className={`form-input ${errors.password ? 'error' : ''}`} placeholder="At least 6 characters" value={form.password} onChange={(e) => update('password', e.target.value)} autoComplete="new-password" />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input type={showPassword ? 'text' : 'password'} className={`form-input ${errors.confirmPassword ? 'error' : ''}`} placeholder="Repeat your password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} autoComplete="new-password" />
              </div>
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : <UserPlus size={18} />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-text">
            By registering you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
