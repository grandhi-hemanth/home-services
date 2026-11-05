import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, ArrowRight } from 'lucide-react';
import './ServiceCard.css';

const SERVICE_IMAGES = {
  'Plumbing': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  'Electrical Services': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&q=80',
  'Home Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
  'AC Repair': 'https://images.unsplash.com/photo-1631046552060-c3e1c2d37a43?w=400&q=80',
  'Painting': 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80',
  'Carpentry': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80',
  'Pest Control': 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&q=80',
  'Appliance Repair': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
};

const FALLBACK = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80';

const ServiceCard = ({ service }) => {
  const categoryName = service.category?.categoryName || '';
  const imgSrc = service.image || SERVICE_IMAGES[categoryName] || FALLBACK;

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'}
        fill={i < Math.floor(rating) ? '#F59E0B' : 'none'}
      />
    ));
  };

  return (
    <div className="service-card">
      <div className="service-card-image">
        <img src={imgSrc} alt={service.serviceName} loading="lazy" />
        {service.isFeatured && <span className="featured-badge">Featured</span>}
        <div className="service-category-tag">{categoryName}</div>
      </div>
      <div className="service-card-body">
        <h3 className="service-name">{service.serviceName}</h3>
        <p className="service-desc">{service.shortDescription || service.description?.substring(0, 90) + '...'}</p>
        <div className="service-meta">
          <div className="service-rating">
            <div className="star-rating">{renderStars(service.avgRating || 0)}</div>
            <span className="rating-text">{service.avgRating?.toFixed(1) || '0.0'}</span>
            <span className="review-count">({service.totalReviews || 0})</span>
          </div>
          <div className="service-duration">
            <Clock size={13} />
            <span>{formatDuration(service.duration)}</span>
          </div>
        </div>
        <div className="service-footer">
          <div className="service-price">
            <span className="price-label">{service.priceType === 'fixed' ? 'Fixed' : 'Starting from'}</span>
            <span className="price-amount">${service.price}</span>
          </div>
          <Link to={`/services/${service._id}`} className="btn btn-primary btn-sm">
            Book Now <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
