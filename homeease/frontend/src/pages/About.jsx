import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Clock, Star, Users, Award, Target } from 'lucide-react';
import './About.css';

const About = () => {
  const stats = [
    { value: '10,000+', label: 'Services Completed' },
    { value: '500+', label: 'Verified Professionals' },
    { value: '4.9/5', label: 'Average Rating' },
    { value: '50+', label: 'Service Categories' },
  ];

  const team = [
    { name: 'David Chen', role: 'CEO & Co-Founder', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
    { name: 'Sarah Johnson', role: 'CTO', img: 'https://images.unsplash.com/photo-1494790108755-2616b4de7c89?w=200&q=80' },
    { name: 'Marcus Lee', role: 'Head of Operations', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' },
    { name: 'Emily Davis', role: 'Head of Customer Success', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
  ];

  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="container about-hero-content">
          <div className="about-hero-text">
            <h1>About HomeEase</h1>
            <p>We built HomeEase to make home maintenance simple, reliable, and stress-free. Our mission is to connect homeowners with the best local service professionals.</p>
            <Link to="/services" className="btn btn-primary btn-lg">Explore Services</Link>
          </div>
          <div className="about-hero-img">
            <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80" alt="Our team" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="about-stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section">
        <div className="container">
          <div className="mission-grid">
            <div>
              <h2 className="section-title">Our Mission</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '20px' }}>
                HomeEase was founded with a simple belief: everyone deserves access to reliable, affordable home services delivered by trusted professionals.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                We are building a platform where quality craftsmanship meets modern technology — making it effortless for homeowners to find, book, and manage home service professionals.
              </p>
            </div>
            <div className="values-grid">
              {[
                { icon: <Shield size={22} />, title: 'Trust & Safety', desc: 'All professionals undergo rigorous background checks and skills verification.' },
                { icon: <Star size={22} />, title: 'Quality First', desc: 'We maintain high standards with ratings, reviews, and accountability.' },
                { icon: <Clock size={22} />, title: 'Reliability', desc: 'Punctual professionals who respect your time and deliver on promises.' },
                { icon: <Users size={22} />, title: 'Community', desc: 'Supporting local professionals and strengthening communities.' },
              ].map((v) => (
                <div key={v.title} className="value-card">
                  <div className="value-icon">{v.icon}</div>
                  <div>
                    <h4>{v.title}</h4>
                    <p>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Meet the Team</h2>
            <p className="section-subtitle">Passionate people building the future of home services</p>
          </div>
          <div className="grid-4">
            {team.map((member) => (
              <div key={member.name} className="team-card card">
                <img src={member.img} alt={member.name} className="team-img" />
                <div className="team-info">
                  <h4>{member.name}</h4>
                  <span>{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container" style={{ textAlign: 'center' }}>
          <Award size={48} style={{ color: 'var(--secondary)', marginBottom: '20px' }} />
          <h2>Ready to Experience HomeEase?</h2>
          <p>Join thousands of homeowners who trust us for all their home service needs.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
            <Link to="/contact" className="btn btn-secondary btn-lg">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
