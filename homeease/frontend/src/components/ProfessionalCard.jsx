import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Briefcase, CheckCircle2 } from 'lucide-react';
import './ProfessionalCard.css';

const AVATAR_COLORS = ['#142B4A', '#18A878', '#2563EB', '#7C3AED', '#DB2777', '#D97706'];

const ProfessionalCard = ({ professional, serviceId }) => {
  const user = professional.userId || {};
  const name = user.name || 'Professional';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colorIndex = name.charCodeAt(0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[colorIndex];
  const categories = professional.serviceCategories?.map(c => c.categoryName || c).join(', ') || '';

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={13}
        fill={i < Math.floor(rating) ? '#F59E0B' : 'none'}
        color={i < Math.floor(rating) ? '#F59E0B' : '#D1D5DB'}
      />
    ));
  };

  return (
    <div className="pro-card">
      <div className="pro-card-header">
        <div className="pro-avatar" style={{ background: user.profileImage ? 'transparent' : avatarColor }}>
          {user.profileImage
            ? <img src={user.profileImage} alt={name} />
            : <span>{initials}</span>
          }
        </div>
        {professional.verificationStatus === 'verified' && (
          <div className="pro-verified-badge">
            <CheckCircle2 size={14} />
            <span>Verified</span>
          </div>
        )}
      </div>
      <div className="pro-card-body">
        <h3 className="pro-name">{name}</h3>
        <p className="pro-categories">{categories}</p>
        <div className="pro-stats">
          <div className="pro-stat">
            <div className="stat-value">
              {renderStars(professional.rating || 0)}
              <span className="stat-num">{(professional.rating || 0).toFixed(1)}</span>
            </div>
            <span className="stat-label">Rating</span>
          </div>
          <div className="pro-stat-divider" />
          <div className="pro-stat">
            <div className="stat-value">
              <Briefcase size={14} style={{ color: 'var(--secondary)' }} />
              <span className="stat-num">{professional.completedJobs || 0}</span>
            </div>
            <span className="stat-label">Jobs Done</span>
          </div>
          <div className="pro-stat-divider" />
          <div className="pro-stat">
            <div className="stat-value">
              <span className="stat-num">{professional.experience || 0}yr</span>
            </div>
            <span className="stat-label">Experience</span>
          </div>
        </div>
        {professional.description && (
          <p className="pro-desc">{professional.description.substring(0, 100)}...</p>
        )}
      </div>
      <div className="pro-card-footer">
        {professional.hourlyRate && (
          <span className="pro-rate">${professional.hourlyRate}<span>/hr</span></span>
        )}
        <Link
          to={serviceId ? `/booking/${serviceId}?professional=${professional._id}` : `/services`}
          className="btn btn-primary btn-sm"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
};

export default ProfessionalCard;
