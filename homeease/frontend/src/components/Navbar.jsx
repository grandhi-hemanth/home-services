import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Wrench, Info, Phone, Calendar, LogIn, UserPlus,
  User, LogOut, LayoutDashboard, ChevronDown, Menu, X, Shield
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home size={15} /> },
    { to: '/services', label: 'Services', icon: <Wrench size={15} /> },
    { to: '/about', label: 'About Us', icon: <Info size={15} /> },
    { to: '/contact', label: 'Contact', icon: <Phone size={15} /> },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">Home<span>Ease</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-links">
          {navLinks.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {icon} {label}
            </NavLink>
          ))}
          {isAuthenticated && user?.role === 'customer' && (
            <NavLink to="/my-bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={15} /> My Bookings
            </NavLink>
          )}
        </nav>

        {/* Auth Section */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-dropdown" ref={dropdownRef}>
              <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="user-avatar">
                  {user?.profileImage
                    ? <img src={user.profileImage} alt={user.name} />
                    : <span>{user?.name?.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <span className="user-name">{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{user?.name}</span>
                    <span className="dropdown-role">{user?.role}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <User size={15} /> Profile
                  </Link>
                  {user?.role === 'professional' && (
                    <Link to="/professional/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Shield size={15} /> Admin Panel
                    </Link>
                  )}
                  {user?.role === 'customer' && (
                    <Link to="/my-bookings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Calendar size={15} /> My Bookings
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} /> Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className="mobile-link" onClick={() => setMenuOpen(false)}>
              {label}
            </NavLink>
          ))}
          {isAuthenticated && user?.role === 'customer' && (
            <NavLink to="/my-bookings" className="mobile-link" onClick={() => setMenuOpen(false)}>
              My Bookings
            </NavLink>
          )}
          <div className="mobile-divider" />
          {isAuthenticated ? (
            <>
              <NavLink to="/profile" className="mobile-link" onClick={() => setMenuOpen(false)}>Profile</NavLink>
              {user?.role === 'professional' && (
                <NavLink to="/professional/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className="mobile-link" onClick={() => setMenuOpen(false)}>Admin Panel</NavLink>
              )}
              <button className="mobile-link danger-link" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mobile-link" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
