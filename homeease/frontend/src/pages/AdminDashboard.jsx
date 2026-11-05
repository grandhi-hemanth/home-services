import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Settings, ShoppingBag, Star,
  LogOut, Menu, X, TrendingUp, CheckCircle, Clock, AlertCircle,
  ChevronDown, Edit2, Trash2, Plus, RefreshCw, Shield
} from 'lucide-react';
import { adminService } from '../services/bookingService';
import { serviceService } from '../services/serviceService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

/* ============== Shared Components ============== */
const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="admin-stat-card" style={{ borderTopColor: color }}>
    <div className="admin-stat-icon" style={{ color }}>{icon}</div>
    <div className="admin-stat-info">
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
      {sub && <span className="admin-stat-sub">{sub}</span>}
    </div>
  </div>
);

/* ============== Overview Panel ============== */
const Overview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard().then((res) => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state"><p>Could not load dashboard data.</p></div>;

  const { stats: s, recentBookings, bookingsByStatus } = stats;

  return (
    <div className="admin-panel">
      <h2 className="admin-panel-title">Dashboard Overview</h2>
      <div className="admin-stats-grid">
        <StatCard icon={<Users size={22} />} label="Total Customers" value={s.totalCustomers} color="#2563EB" />
        <StatCard icon={<Briefcase size={22} />} label="Professionals" value={s.totalProfessionals} color="#7C3AED" />
        <StatCard icon={<ShoppingBag size={22} />} label="Services" value={s.totalServices} color="#D97706" />
        <StatCard icon={<TrendingUp size={22} />} label="Total Bookings" value={s.totalBookings} color="#0891B2" />
        <StatCard icon={<CheckCircle size={22} />} label="Completed" value={s.completedBookings} color="#16A34A" />
        <StatCard icon={<Clock size={22} />} label="Pending" value={s.pendingBookings} color="#D97706" />
        <StatCard icon={<Settings size={22} />} label="Categories" value={s.totalCategories} color="#DB2777" />
        <StatCard icon={<TrendingUp size={22} />} label="Revenue" value={`$${s.totalRevenue?.toLocaleString()}`} color="#18A878" sub="From completed bookings" />
      </div>

      {/* Recent Bookings */}
      <div className="admin-table-section">
        <h3>Recent Bookings</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings?.map((b) => (
                <tr key={b._id}>
                  <td><span className="mono-text">{b.bookingId}</span></td>
                  <td>{b.customerId?.name}</td>
                  <td>{b.serviceId?.serviceName}</td>
                  <td>{new Date(b.appointmentDate).toLocaleDateString()}</td>
                  <td>${b.totalAmount}</td>
                  <td><span className={`badge badge-${b.bookingStatus}`}>{b.bookingStatus.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="admin-status-breakdown">
        <h3>Bookings by Status</h3>
        <div className="status-bars">
          {bookingsByStatus?.map((item) => {
            const pct = s.totalBookings ? Math.round((item.count / s.totalBookings) * 100) : 0;
            return (
              <div key={item._id} className="status-bar-row">
                <span className="status-bar-label">{item._id}</span>
                <div className="status-bar-track">
                  <div className="status-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="status-bar-count">{item.count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============== Users Panel ============== */
const UsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    adminService.getUsers({ role: roleFilter, search }).then((res) => {
      setUsers(res.data.users || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [roleFilter, search]);

  const handleToggle = async (id) => {
    try {
      await adminService.toggleUserStatus(id);
      toast.success('User status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Manage Users</h2>
        <div className="admin-filters">
          <input className="form-input admin-search" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="form-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ maxWidth: '150px' }}>
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="professional">Professionals</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td><span className="role-chip">{u.role}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td><span className={`status-dot ${u.isActive ? 'active' : 'inactive'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => handleToggle(u._id)} style={{ fontSize: '0.78rem' }}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ============== Professionals Panel ============== */
const ProfessionalsPanel = () => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    adminService.getProfessionals({ verificationStatus: statusFilter }).then((res) => {
      setProfessionals(res.data.professionals || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleVerify = async (id, status) => {
    try {
      await adminService.verifyProfessional(id, { status });
      toast.success(`Professional ${status}`);
      load();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Manage Professionals</h2>
        <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '180px' }}>
          <option value="">All Status</option>
          <option value="pending">Pending Verification</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Experience</th><th>Rating</th><th>Jobs</th><th>Verification</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {professionals.map((p) => (
                <tr key={p._id}>
                  <td><strong>{p.userId?.name}</strong></td>
                  <td>{p.userId?.email}</td>
                  <td>{p.experience} years</td>
                  <td>⭐ {p.rating?.toFixed(1) || '0.0'}</td>
                  <td>{p.completedJobs}</td>
                  <td>
                    <span className={`badge badge-${p.verificationStatus === 'pending' ? 'pending-verify' : p.verificationStatus}`}>
                      {p.verificationStatus}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {p.verificationStatus !== 'verified' && (
                      <button className="btn btn-sm btn-primary" style={{ fontSize: '0.78rem' }} onClick={() => handleVerify(p._id, 'verified')}>
                        <Shield size={12} /> Verify
                      </button>
                    )}
                    {p.verificationStatus !== 'rejected' && (
                      <button className="btn btn-sm btn-danger" style={{ fontSize: '0.78rem' }} onClick={() => handleVerify(p._id, 'rejected')}>
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ============== Services Panel ============== */
const ServicesPanel = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ serviceName: '', category: '', description: '', price: '', duration: '', priceType: 'starting_from', isFeatured: false });

  const load = async () => {
    setLoading(true);
    const [svcRes, catRes] = await Promise.all([
      serviceService.getAll({ limit: 50 }),
      serviceService.getCategories(),
    ]);
    setServices(svcRes.data.services || []);
    setCategories(catRes.data.categories || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) {
        await serviceService.update(editTarget, form);
        toast.success('Service updated');
      } else {
        await serviceService.create(form);
        toast.success('Service created');
      }
      setShowForm(false);
      setEditTarget(null);
      setForm({ serviceName: '', category: '', description: '', price: '', duration: '', priceType: 'starting_from', isFeatured: false });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await serviceService.delete(id);
      toast.success('Service deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const startEdit = (svc) => {
    setEditTarget(svc._id);
    setForm({ serviceName: svc.serviceName, category: svc.category?._id || svc.category, description: svc.description, price: svc.price, duration: svc.duration, priceType: svc.priceType, isFeatured: svc.isFeatured });
    setShowForm(true);
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Manage Services</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditTarget(null); setForm({ serviceName: '', category: '', description: '', price: '', duration: '', priceType: 'starting_from', isFeatured: false }); }}>
          <Plus size={15} /> {showForm ? 'Cancel' : 'Add Service'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="admin-form">
          <h3>{editTarget ? 'Edit Service' : 'New Service'}</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Service Name *</label>
              <input className="form-input" value={form.serviceName} onChange={(e) => setForm((p) => ({ ...p, serviceName: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required>
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price ($) *</label>
              <input type="number" className="form-input" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes) *</label>
              <input type="number" className="form-input" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} required min="15" />
            </div>
            <div className="form-group">
              <label className="form-label">Price Type</label>
              <select className="form-input" value={form.priceType} onChange={(e) => setForm((p) => ({ ...p, priceType: e.target.value }))}>
                <option value="starting_from">Starting From</option>
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
              <input type="checkbox" id="featured" checked={form.isFeatured} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))} />
              <label htmlFor="featured" style={{ margin: 0, cursor: 'pointer' }}>Featured Service</label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary btn-sm">Save Service</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Service</th><th>Category</th><th>Price</th><th>Duration</th><th>Rating</th><th>Bookings</th><th>Featured</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.serviceName}</strong></td>
                  <td>{s.category?.categoryName}</td>
                  <td>${s.price}</td>
                  <td>{s.duration}m</td>
                  <td>⭐ {s.avgRating?.toFixed(1)}</td>
                  <td>{s.totalBookings}</td>
                  <td>{s.isFeatured ? '✅' : '—'}</td>
                  <td className="action-buttons">
                    <button className="btn btn-sm btn-secondary" onClick={() => startEdit(s)} style={{ fontSize: '0.78rem' }}><Edit2 size={12} /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)} style={{ fontSize: '0.78rem' }}><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ============== Bookings Panel ============== */
const BookingsPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    adminService.getBookings({ status: statusFilter, limit: 50 }).then((res) => {
      setBookings(res.data.bookings || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatusUpdate = async (id, status) => {
    try {
      const { bookingService } = await import('../services/bookingService');
      await bookingService.updateStatus(id, { status });
      toast.success('Status updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">All Bookings</h2>
        <div className="admin-filters">
          <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '180px' }}>
            <option value="">All Statuses</option>
            {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={14} /></button>
        </div>
      </div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Professional</th><th>Date</th><th>Amount</th><th>Status</th><th>Update</th></tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td><span className="mono-text">{b.bookingId}</span></td>
                  <td>{b.customerId?.name}</td>
                  <td>{b.serviceId?.serviceName}</td>
                  <td>{b.professionalId?.userId?.name || '—'}</td>
                  <td>{new Date(b.appointmentDate).toLocaleDateString()}</td>
                  <td>${b.totalAmount}</td>
                  <td><span className={`badge badge-${b.bookingStatus}`}>{b.bookingStatus.replace('_', ' ')}</span></td>
                  <td>
                    <select className="form-input" style={{ padding: '4px 8px', fontSize: '0.78rem', maxWidth: '130px' }}
                      value={b.bookingStatus}
                      onChange={(e) => handleStatusUpdate(b._id, e.target.value)}
                    >
                      {['pending', 'confirmed', 'professional_assigned', 'in_progress', 'completed', 'cancelled'].map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ============== Revenue Panel ============== */
const RevenuePanel = () => {
  const [revenue, setRevenue] = useState(null);

  useEffect(() => {
    adminService.getRevenue().then((res) => setRevenue(res.data)).catch(() => {});
  }, []);

  return (
    <div className="admin-panel">
      <h2 className="admin-panel-title">Revenue Overview</h2>
      {revenue && (
        <>
          <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: '500px' }}>
            <StatCard icon={<TrendingUp size={22} />} label="Total Revenue" value={`$${revenue.totalRevenue?.toLocaleString()}`} color="#18A878" />
            <StatCard icon={<CheckCircle size={22} />} label="Completed Bookings" value={revenue.totalCompletedBookings} color="#16A34A" />
          </div>
          <div className="admin-table-section" style={{ marginTop: '24px' }}>
            <h3>Top Revenue Services</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Service</th><th>Bookings</th><th>Revenue</th></tr></thead>
                <tbody>
                  {revenue.topServices?.map((s) => (
                    <tr key={s._id}>
                      <td>{s.service?.[0]?.serviceName || 'Unknown'}</td>
                      <td>{s.count}</td>
                      <td><strong>${s.revenue?.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ============== Main AdminDashboard ============== */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/'); };

  const navItems = [
    { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Overview', end: true },
    { to: '/admin/users', icon: <Users size={18} />, label: 'Users' },
    { to: '/admin/professionals', icon: <Briefcase size={18} />, label: 'Professionals' },
    { to: '/admin/services', icon: <Settings size={18} />, label: 'Services' },
    { to: '/admin/bookings', icon: <ShoppingBag size={18} />, label: 'Bookings' },
    { to: '/admin/revenue', icon: <TrendingUp size={18} />, label: 'Revenue' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-logo">🏠 HomeEase</Link>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <div className="admin-sidebar-user">
          <div className="admin-user-avatar">{user?.name?.charAt(0)}</div>
          {sidebarOpen && (
            <div>
              <strong>{user?.name}</strong>
              <span>Administrator</span>
            </div>
          )}
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Top Bar */}
        <div className="admin-topbar">
          <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
          <h2 className="admin-topbar-title">Admin Dashboard</h2>
          <div className="admin-topbar-right">
            <Link to="/" className="btn btn-secondary btn-sm">View Site</Link>
          </div>
        </div>

        {/* Content */}
        <div className="admin-content">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="users" element={<UsersPanel />} />
            <Route path="professionals" element={<ProfessionalsPanel />} />
            <Route path="services" element={<ServicesPanel />} />
            <Route path="bookings" element={<BookingsPanel />} />
            <Route path="revenue" element={<RevenuePanel />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
