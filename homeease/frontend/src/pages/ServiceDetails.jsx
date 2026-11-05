import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, CheckCircle, ArrowLeft, Calendar, AlertCircle } from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { professionalService, reviewService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import ProfessionalCard from '../components/ProfessionalCard';
import './ServiceDetails.css';

const SERVICE_IMAGES = {
  Plumbing: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
  'Electrical Services': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=900&q=80',
  'Home Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80',
  'AC Repair': 'https://images.unsplash.com/photo-1631046552060-c3e1c2d37a43?w=900&q=80',
  Painting: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=900&q=80',
  Carpentry: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900&q=80',
  'Pest Control': 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=900&q=80',
  'Appliance Repair': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=900&q=80',
};

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [svcRes, proRes] = await Promise.all([
          serviceService.getById(id),
          professionalService.getByService(id),
        ]);
        const svc = svcRes.data.service;
        setService(svc);
        setProfessionals(proRes.data.professionals || []);

        // Fetch reviews for professionals
        if (proRes.data.professionals?.length > 0) {
          const reviewRes = await reviewService.getByProfessional(proRes.data.professionals[0]._id, { limit: 5 });
          setReviews(reviewRes.data.reviews || []);
        }
      } catch {
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading service details...</p>
      </div>
    );
  }

  if (!service) return null;

  const categoryName = service.category?.categoryName || '';
  const imgSrc = service.image || SERVICE_IMAGES[categoryName] || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80';
  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? (m ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`) : `${m} minutes`;
  };

  const renderStars = (rating, size = 16) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={size} fill={i < Math.floor(rating) ? '#F59E0B' : 'none'} color={i < Math.floor(rating) ? '#F59E0B' : '#D1D5DB'} />
    ));

  return (
    <div className="service-details-page">
      {/* Back */}
      <div className="container details-back">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={16} /> Back to Services
        </button>
      </div>

      <div className="container details-layout">
        {/* Left */}
        <div className="details-main">
          {/* Hero Image */}
          <div className="details-image">
            <img src={imgSrc} alt={service.serviceName} />
            <div className="details-image-overlay">
              <span className="details-category-badge">{categoryName}</span>
            </div>
          </div>

          {/* Info */}
          <div className="details-info card">
            <div className="details-title-row">
              <div>
                <h1>{service.serviceName}</h1>
                <div className="details-rating">
                  <div className="star-rating">{renderStars(service.avgRating || 0)}</div>
                  <span className="rating-num">{(service.avgRating || 0).toFixed(1)}</span>
                  <span className="review-num">({service.totalReviews || 0} reviews)</span>
                  <span className="booking-num">· {service.totalBookings || 0} bookings</span>
                </div>
              </div>
              <div className="details-price-box">
                <span className="price-type-label">{service.priceType === 'fixed' ? 'Fixed Price' : 'Starting from'}</span>
                <span className="price-big">${service.price}</span>
              </div>
            </div>

            <div className="service-meta-row">
              <div className="service-meta-item">
                <Clock size={16} />
                <span>{formatDuration(service.duration)}</span>
              </div>
            </div>

            <p className="details-description">{service.description}</p>

            {service.features?.length > 0 && (
              <div className="details-features">
                <h3>What's Included</h3>
                <ul>
                  {service.features.map((f, i) => (
                    <li key={i}>
                      <CheckCircle size={15} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Customer Reviews */}
          {reviews.length > 0 && (
            <div className="details-reviews card">
              <h2>Customer Reviews</h2>
              <div className="reviews-list">
                {reviews.map((r) => (
                  <div key={r._id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-avatar">
                        {r.customerId?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <strong>{r.customerId?.name || 'Customer'}</strong>
                        <div className="review-stars">{renderStars(r.rating, 13)}</div>
                      </div>
                      <span className="review-date">
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="review-comment">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right – Booking Sidebar */}
        <aside className="details-sidebar">
          <div className="booking-card card">
            <h3>Ready to Book?</h3>
            <div className="booking-price">
              <span>Starting from</span>
              <strong>${service.price}</strong>
            </div>
            <div className="booking-info-list">
              <div className="booking-info-item">
                <Clock size={14} />
                <span>{formatDuration(service.duration)} service duration</span>
              </div>
              <div className="booking-info-item">
                <Calendar size={14} />
                <span>Flexible scheduling available</span>
              </div>
              <div className="booking-info-item">
                <CheckCircle size={14} />
                <span>Satisfaction guaranteed</span>
              </div>
            </div>

            {user?.role === 'customer' ? (
              <Link to={`/booking/${service._id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                Book This Service
              </Link>
            ) : user?.role === 'professional' || user?.role === 'admin' ? (
              <div className="booking-notice">
                <AlertCircle size={14} />
                <span>Log in as a customer to book services</span>
              </div>
            ) : (
              <Link to={`/login?redirect=/booking/${service._id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                Login to Book
              </Link>
            )}
          </div>

          {/* Quick Stats */}
          <div className="quick-stats card">
            <div className="quick-stat">
              <strong>{service.totalBookings || 0}</strong>
              <span>Total Bookings</span>
            </div>
            <div className="quick-stat">
              <strong>{(service.avgRating || 0).toFixed(1)}</strong>
              <span>Avg Rating</span>
            </div>
            <div className="quick-stat">
              <strong>{professionals.length}</strong>
              <span>Pros Available</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Professionals Section */}
      {professionals.length > 0 && (
        <div className="container professionals-section-details">
          <h2>Available Professionals</h2>
          <p>Choose from our verified professionals for this service</p>
          <div className="grid-4" style={{ marginTop: '24px' }}>
            {professionals.map((p) => (
              <ProfessionalCard key={p._id} professional={p} serviceId={service._id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetails;
