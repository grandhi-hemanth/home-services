import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, CheckCircle, Star, Calendar, ChevronDown, ChevronUp, AlertCircle, Edit2, Save } from 'lucide-react';
import { bookingService, professionalService, reviewService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './ProfessionalDashboard.css';

const STATUS_CONFIG = {
  pending: { label: 'Pending', class: 'badge-pending', nextAction: 'confirmed', nextLabel: 'Accept' },
  confirmed: { label: 'Confirmed', class: 'badge-confirmed', nextAction: 'in_progress', nextLabel: 'Start Job' },
  in_progress: { label: 'In Progress', class: 'badge-in_progress', nextAction: 'completed', nextLabel: 'Mark Complete' },
  completed: { label: 'Completed', class: 'badge-completed', nextAction: null },
  cancelled: { label: 'Cancelled', class: 'badge-cancelled', nextAction: null },
};

const BookingRow = ({ booking, onUpdateStatus }) => {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[booking.bookingStatus] || { label: booking.bookingStatus, class: 'badge-pending' };
  const customer = booking.customerId;

  return (
    <div className="pro-booking-row">
      <div className="pro-booking-header" onClick={() => setExpanded(!expanded)}>
        <div className="pro-booking-meta">
          <span className={`badge ${status.class}`}>{status.label}</span>
          <span className="booking-id-small">{booking.bookingId}</span>
        </div>
        <div className="pro-booking-info">
          <strong>{booking.serviceId?.serviceName || 'Service'}</strong>
          <span>{customer?.name || 'Customer'}</span>
        </div>
        <div className="pro-booking-time">
          <span>
            <Calendar size={12} />
            {new Date(booking.appointmentDate).toLocaleDateString()}
          </span>
          <span>{booking.timeSlot}</span>
        </div>
        <div className="pro-booking-amount">${booking.totalAmount}</div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {expanded && (
        <div className="pro-booking-expanded">
          <div className="pro-booking-detail-grid">
            <div><strong>Customer Phone:</strong> {customer?.phone || 'N/A'}</div>
            <div><strong>Address:</strong> {booking.address?.street}, {booking.address?.city}</div>
            {booking.instructions && <div style={{ gridColumn: '1 / -1' }}><strong>Instructions:</strong> {booking.instructions}</div>}
          </div>
          {status.nextAction && (
            <button
              className={`btn btn-primary btn-sm ${status.nextAction === 'completed' ? 'complete-btn' : ''}`}
              onClick={() => onUpdateStatus(booking._id, status.nextAction)}
            >
              {status.nextLabel}
            </button>
          )}
          {booking.bookingStatus === 'pending' && (
            <button className="btn btn-danger btn-sm" onClick={() => onUpdateStatus(booking._id, 'cancelled')} style={{ marginLeft: '8px' }}>
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const ProfessionalDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [editingAvail, setEditingAvail] = useState(false);
  const [availability, setAvailability] = useState([]);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingRes, profileRes] = await Promise.all([
        bookingService.getProfessionalBookings({ limit: 50 }),
        professionalService.getMyProfile(),
      ]);
      const bkgs = bookingRes.data.bookings || [];
      setBookings(bkgs);
      const prof = profileRes.data.professional;
      setProfile(prof);
      setAvailability(prof.availability || DAYS.map((d) => ({ day: d, startTime: '09:00', endTime: '18:00', isAvailable: d !== 'Sunday' })));

      if (prof) {
        const reviewRes = await reviewService.getByProfessional(prof._id, { limit: 10 });
        setReviews(reviewRes.data.reviews || []);
      }

      setStats({
        total: bkgs.length,
        pending: bkgs.filter((b) => b.bookingStatus === 'pending').length,
        completed: bkgs.filter((b) => b.bookingStatus === 'completed').length,
        rating: prof?.rating || 0,
      });
    } catch {
      // profile might not exist yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await bookingService.updateStatus(bookingId, { status });
      toast.success(`Booking marked as ${status}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await professionalService.updateAvailability({ availability });
      toast.success('Availability updated');
      setEditingAvail(false);
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'availability', label: 'Availability' },
  ];

  const statCards = [
    { icon: <Briefcase size={22} />, label: 'Total Jobs', value: stats.total, color: '#EFF6FF' },
    { icon: <Clock size={22} />, label: 'Pending', value: stats.pending, color: '#FEF9C3' },
    { icon: <CheckCircle size={22} />, label: 'Completed', value: stats.completed, color: '#DCFCE7' },
    { icon: <Star size={22} />, label: 'Avg Rating', value: stats.rating.toFixed(1), color: '#FFF7ED' },
  ];

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="pro-dashboard">
      {/* Header */}
      <div className="pro-dashboard-header">
        <div className="container">
          <div className="pro-header-content">
            <div className="pro-header-avatar">
              {user?.profileImage
                ? <img src={user.profileImage} alt={user.name} />
                : <span>{user?.name?.charAt(0)}</span>
              }
            </div>
            <div>
              <h1>Welcome, {user?.name?.split(' ')[0]}!</h1>
              <p>
                {profile?.verificationStatus === 'verified'
                  ? '✅ Verified Professional'
                  : profile?.verificationStatus === 'pending'
                  ? '⏳ Verification Pending'
                  : '❌ Not Verified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container pro-dashboard-body">
        {/* Tabs */}
        <div className="pro-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`pro-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div>
            <div className="stat-cards-grid">
              {statCards.map((s) => (
                <div key={s.label} className="stat-card" style={{ background: s.color }}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-info">
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Bookings Preview */}
            {bookings.slice(0, 3).length > 0 && (
              <div className="recent-bookings card">
                <h3>Recent Bookings</h3>
                <div className="pro-booking-list">
                  {bookings.slice(0, 3).map((b) => (
                    <BookingRow key={b._id} booking={b} onUpdateStatus={handleUpdateStatus} />
                  ))}
                </div>
              </div>
            )}

            {!profile && (
              <div className="profile-incomplete card">
                <AlertCircle size={24} />
                <div>
                  <strong>Complete Your Profile</strong>
                  <p>Add your skills, experience, and availability to start receiving bookings.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((status) => {
              const filtered = bookings.filter((b) => b.bookingStatus === status);
              if (filtered.length === 0) return null;
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={status} className="booking-group card">
                  <h3 className="booking-group-title">
                    <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                    <span className="booking-count">({filtered.length})</span>
                  </h3>
                  <div className="pro-booking-list">
                    {filtered.map((b) => (
                      <BookingRow key={b._id} booking={b} onUpdateStatus={handleUpdateStatus} />
                    ))}
                  </div>
                </div>
              );
            })}
            {bookings.length === 0 && (
              <div className="empty-state card">
                <div className="empty-icon">📋</div>
                <h3>No bookings yet</h3>
                <p>Once customers book your services, they will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="card" style={{ padding: '24px' }}>
            <div className="reviews-summary">
              <div className="avg-rating-display">
                <strong>{stats.rating.toFixed(1)}</strong>
                <div className="star-row">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={20} fill={i < Math.floor(stats.rating) ? '#F59E0B' : 'none'} color={i < Math.floor(stats.rating) ? '#F59E0B' : '#D1D5DB'} />
                  ))}
                </div>
                <span>Based on {reviews.length} reviews</span>
              </div>
            </div>
            {reviews.length > 0 ? (
              <div className="reviews-feed">
                {reviews.map((r) => (
                  <div key={r._id} className="review-feed-item">
                    <div className="review-feed-header">
                      <div className="review-feed-avatar">{r.customerId?.name?.charAt(0)}</div>
                      <div>
                        <strong>{r.customerId?.name}</strong>
                        <div>
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} size={12} fill={i < r.rating ? '#F59E0B' : 'none'} color={i < r.rating ? '#F59E0B' : '#D1D5DB'} />
                          ))}
                        </div>
                      </div>
                      <span className="review-feed-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="review-feed-comment">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                <p>No reviews yet. Complete jobs to receive reviews from customers.</p>
              </div>
            )}
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="card availability-panel">
            <div className="availability-header">
              <h3>Weekly Availability</h3>
              {!editingAvail ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingAvail(true)}>
                  <Edit2 size={14} /> Edit
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleSaveAvailability}>
                  <Save size={14} /> Save
                </button>
              )}
            </div>
            <div className="availability-grid">
              {DAYS.map((day) => {
                const slot = availability.find((a) => a.day === day) || { day, startTime: '09:00', endTime: '18:00', isAvailable: false };
                return (
                  <div key={day} className={`avail-row ${!slot.isAvailable ? 'unavailable' : ''}`}>
                    <div className="avail-day">{day}</div>
                    {editingAvail ? (
                      <div className="avail-edit">
                        <input
                          type="checkbox"
                          checked={slot.isAvailable}
                          onChange={(e) => {
                            const updated = availability.map((a) => a.day === day ? { ...a, isAvailable: e.target.checked } : a);
                            const exists = availability.find((a) => a.day === day);
                            if (!exists) setAvailability([...availability, { day, startTime: '09:00', endTime: '18:00', isAvailable: e.target.checked }]);
                            else setAvailability(updated);
                          }}
                        />
                        {slot.isAvailable && (
                          <>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => setAvailability(availability.map((a) => a.day === day ? { ...a, startTime: e.target.value } : a))}
                            />
                            <span>—</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => setAvailability(availability.map((a) => a.day === day ? { ...a, endTime: e.target.value } : a))}
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="avail-times">
                        {slot.isAvailable
                          ? <span className="avail-open">{slot.startTime} – {slot.endTime}</span>
                          : <span className="avail-closed">Unavailable</span>
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
