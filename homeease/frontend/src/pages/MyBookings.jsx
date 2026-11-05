import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Star, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { bookingService, reviewService } from '../services/bookingService';
import { toast } from 'react-toastify';
import './MyBookings.css';

const STATUS_CONFIG = {
  pending: { label: 'Pending', class: 'badge-pending' },
  confirmed: { label: 'Confirmed', class: 'badge-confirmed' },
  professional_assigned: { label: 'Pro Assigned', class: 'badge-professional_assigned' },
  in_progress: { label: 'In Progress', class: 'badge-in_progress' },
  completed: { label: 'Completed', class: 'badge-completed' },
  cancelled: { label: 'Cancelled', class: 'badge-cancelled' },
};

const ReviewModal = ({ booking, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return toast.error('Please add a comment');
    setSubmitting(true);
    try {
      await onSubmit({ bookingId: booking._id, rating, comment });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Write a Review</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="modal-service-name">{booking.serviceId?.serviceName}</p>
          <div className="star-selector">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} className={`star-btn ${s <= rating ? 'filled' : ''}`} onClick={() => setRating(s)}>
                <Star size={28} fill={s <= rating ? '#F59E0B' : 'none'} color={s <= rating ? '#F59E0B' : '#D1D5DB'} />
              </button>
            ))}
            <span className="rating-label">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</span>
          </div>
          <div className="form-group">
            <label className="form-label">Your Review</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Share your experience with this service..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onCancel, onReview }) => {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[booking.bookingStatus] || { label: booking.bookingStatus, class: 'badge-pending' };
  const proUser = booking.professionalId?.userId;
  const canCancel = ['pending', 'confirmed'].includes(booking.bookingStatus);

  return (
    <div className="booking-card">
      <div className="booking-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="booking-header-left">
          <span className="booking-id">{booking.bookingId}</span>
          <span className={`badge ${status.class}`}>{status.label}</span>
        </div>
        <div className="booking-header-right">
          <span className="booking-date">
            <Calendar size={13} />
            {new Date(booking.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="booking-amount">${booking.totalAmount}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      <div className="booking-service-row">
        <h4>{booking.serviceId?.serviceName || 'Service'}</h4>
        {proUser && (
          <span className="booking-pro">
            <User size={13} />
            {proUser.name}
          </span>
        )}
      </div>

      {expanded && (
        <div className="booking-details-expanded">
          <div className="details-grid">
            <div className="detail-item">
              <Clock size={14} />
              <span>Time: <strong>{booking.timeSlot}</strong></span>
            </div>
            <div className="detail-item">
              <MapPin size={14} />
              <span>{booking.address?.street}, {booking.address?.city}, {booking.address?.state}</span>
            </div>
          </div>

          {booking.instructions && (
            <div className="booking-instructions">
              <strong>Instructions:</strong> {booking.instructions}
            </div>
          )}

          <div className="booking-price-breakdown">
            <div className="pb-row"><span>Service Price</span><span>${booking.servicePrice}</span></div>
            <div className="pb-row"><span>Additional Charges</span><span>${booking.additionalCharges || 0}</span></div>
            <div className="pb-row total"><strong>Total</strong><strong>${booking.totalAmount}</strong></div>
          </div>

          <div className="booking-actions">
            {canCancel && (
              <button className="btn btn-danger btn-sm" onClick={() => onCancel(booking)}>
                Cancel Booking
              </button>
            )}
            {booking.bookingStatus === 'completed' && !booking.hasReview && (
              <button className="btn btn-primary btn-sm" onClick={() => onReview(booking)}>
                <Star size={14} /> Write Review
              </button>
            )}
            {booking.bookingStatus === 'completed' && booking.hasReview && (
              <span className="reviewed-badge"><Star size={12} fill="#F59E0B" color="#F59E0B" /> Reviewed</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingService.getMyBookings({ status: statusFilter, page, limit: 10 });
      setBookings(res.data.bookings || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, [statusFilter, page]);

  const handleCancel = async () => {
    try {
      await bookingService.cancel(cancelTarget._id, { reason: cancelReason || 'Cancelled by customer' });
      toast.success('Booking cancelled');
      setCancelTarget(null);
      setCancelReason('');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  const handleReview = async (data) => {
    try {
      await reviewService.create(data);
      toast.success('Review submitted!');
      setReviewTarget(null);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    }
  };

  const STATUS_TABS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="my-bookings-page">
      <div className="page-hero">
        <h1>My Bookings</h1>
        <p>View and manage all your service bookings</p>
      </div>

      <div className="container bookings-container">
        {/* Status Filter Tabs */}
        <div className="status-tabs">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              className={`status-tab ${statusFilter === t.value ? 'active' : ''}`}
              onClick={() => { setStatusFilter(t.value); setPage(1); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No bookings found</h3>
            <p>You have no {statusFilter || ''} bookings yet.</p>
            <a href="/services" className="btn btn-primary">Book a Service</a>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                onCancel={setCancelTarget}
                onReview={setReviewTarget}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Booking</h3>
              <button onClick={() => setCancelTarget(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel booking <strong>{cancelTarget.bookingId}</strong>?</p>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Reason (optional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Why are you cancelling?"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setCancelTarget(null)}>Keep Booking</button>
              <button className="btn btn-danger btn-sm" onClick={handleCancel}>Cancel Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
};

export default MyBookings;
