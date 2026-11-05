import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Star, Shield, Clock, ThumbsUp, CheckCircle, ChevronDown, ChevronUp, Wrench, Zap, Sparkles, Wind, Paintbrush, Hammer, Bug, Settings } from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { professionalService } from '../services/bookingService';
import ServiceCard from '../components/ServiceCard';
import ProfessionalCard from '../components/ProfessionalCard';
import './Home.css';

const CATEGORY_ICONS = {
  Plumbing: <Wrench size={28} />,
  'Electrical Services': <Zap size={28} />,
  'Home Cleaning': <Sparkles size={28} />,
  'AC Repair': <Wind size={28} />,
  Painting: <Paintbrush size={28} />,
  Carpentry: <Hammer size={28} />,
  'Pest Control': <Bug size={28} />,
  'Appliance Repair': <Settings size={28} />,
};

const CATEGORY_COLORS = ['#EFF6FF', '#F0FDF4', '#FFF7ED', '#FDF4FF', '#FEF2F2', '#F0F9FF', '#FAFAF5', '#FFF8F1'];

const FAQS = [
  { q: 'How do I book a service?', a: 'Browse services, select one, choose a professional, pick a date and time, and confirm your booking. It takes less than 2 minutes.' },
  { q: 'Are your professionals verified?', a: 'Yes. All professionals undergo background checks, skill verification, and identity verification before joining our platform.' },
  { q: 'What if I am not satisfied with the service?', a: 'We offer a satisfaction guarantee. Contact support within 48 hours of service completion and we will make it right.' },
  { q: 'Can I reschedule or cancel a booking?', a: 'Yes. You can cancel or reschedule bookings that are in Pending or Confirmed status from your My Bookings page.' },
  { q: 'How is pricing determined?', a: 'Pricing is based on service type, complexity, and professional experience. You see the full price before confirming any booking.' },
  { q: 'Is payment secure?', a: 'We use a secure demo payment flow. No real payment is processed. In production, we integrate with trusted payment gateways.' },
];

const TESTIMONIALS = [
  { name: 'Jennifer L.', role: 'Homeowner', rating: 5, text: 'I booked a plumber through HomeEase and he arrived on time, fixed the leak perfectly. Incredible service from start to finish.' },
  { name: 'Marcus T.', role: 'Apartment Resident', rating: 5, text: 'The home cleaning team was thorough and professional. My apartment has never been this clean. Will definitely book again.' },
  { name: 'Rachel K.', role: 'Small Business Owner', rating: 4, text: 'Booked an electrician for my office. The work was high quality and the pricing was transparent. Very happy with HomeEase.' },
];

const Home = () => {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, svcRes, proRes] = await Promise.all([
          serviceService.getCategories(),
          serviceService.getFeatured(),
          professionalService.getAll({ limit: 4, sort: 'rating' }),
        ]);
        setCategories(catRes.data.categories || []);
        setFeaturedServices(svcRes.data.services || []);
        setProfessionals(proRes.data.professionals || []);
      } catch {
        // silently fail – show empty state
      }
    };
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/services?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="home-page">
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-content container">
          <div className="hero-text">
            <div className="hero-badge">🏆 #1 Rated Home Services Platform</div>
            <h1>Your Home Deserves<br />the <span>Best Care</span></h1>
            <p>Book trusted home service professionals at your convenience. Quality guaranteed, transparent pricing, verified experts.</p>

            <form className="hero-search" onSubmit={handleSearch}>
              <div className="search-field">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="What service do you need?"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="search-field">
                <MapPin size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Your location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg">
                <Search size={16} /> Search
              </button>
            </form>

            <div className="hero-stats">
              <div className="hero-stat"><strong>10,000+</strong><span>Services Booked</span></div>
              <div className="hero-stat-divider" />
              <div className="hero-stat"><strong>500+</strong><span>Verified Pros</span></div>
              <div className="hero-stat-divider" />
              <div className="hero-stat"><strong>4.9★</strong><span>Average Rating</span></div>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"
              alt="Professional home service"
            />
            <div className="hero-floating-card card-top">
              <div className="floating-icon">✅</div>
              <div>
                <strong>Booking Confirmed!</strong>
                <span>Plumber – Tomorrow 10 AM</span>
              </div>
            </div>
            <div className="hero-floating-card card-bottom">
              <div className="floating-icon">⭐</div>
              <div>
                <strong>4.9/5 Rating</strong>
                <span>From 10,000+ reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popular Service Categories</h2>
            <p className="section-subtitle">Find the right professional for every home need</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat, i) => (
              <Link
                key={cat._id}
                to={`/services?category=${cat._id}`}
                className="category-card"
                style={{ '--cat-bg': CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
              >
                <div className="category-icon">
                  {CATEGORY_ICONS[cat.categoryName] || <Wrench size={28} />}
                </div>
                <span className="category-name">{cat.categoryName}</span>
                <ArrowRight size={14} className="category-arrow" />
              </Link>
            ))}
          </div>
          {categories.length === 0 && (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How HomeEase Works</h2>
            <p className="section-subtitle">Book a professional in 3 easy steps</p>
          </div>
          <div className="steps-grid">
            {[
              { step: '01', icon: '🔍', title: 'Choose a Service', desc: 'Browse our wide range of home services and select what you need.' },
              { step: '02', icon: '👨‍🔧', title: 'Pick a Professional', desc: 'Compare verified professionals based on ratings and experience.' },
              { step: '03', icon: '📅', title: 'Schedule & Confirm', desc: 'Pick your date, time, and confirm your booking instantly.' },
            ].map((s) => (
              <div key={s.step} className="step-card">
                <div className="step-number">{s.step}</div>
                <div className="step-emoji">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED SERVICES ===== */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Services</h2>
            <p className="section-subtitle">Top-rated services our customers love</p>
          </div>
          {featuredServices.length > 0 ? (
            <>
              <div className="grid-4">
                {featuredServices.slice(0, 8).map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <Link to="/services" className="btn btn-secondary btn-lg">
                  View All Services <ArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <div className="loading-center"><div className="spinner" /></div>
          )}
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="section why-section">
        <div className="container">
          <div className="why-content">
            <div className="why-text">
              <h2 className="section-title">Why Choose HomeEase?</h2>
              <p className="section-subtitle" style={{ textAlign: 'left' }}>
                We connect you with the best professionals who are background-checked, trained, and committed to quality.
              </p>
              <div className="why-features">
                {[
                  { icon: <Shield size={20} />, title: 'Verified Professionals', desc: 'Every professional is background-checked and verified before joining.' },
                  { icon: <Clock size={20} />, title: 'On-Time Service', desc: 'Professionals committed to punctuality and respecting your time.' },
                  { icon: <ThumbsUp size={20} />, title: 'Satisfaction Guarantee', desc: '100% satisfaction guaranteed or we will make it right, free of charge.' },
                  { icon: <CheckCircle size={20} />, title: 'Transparent Pricing', desc: 'No hidden fees. See the full price before you confirm any booking.' },
                ].map((f) => (
                  <div key={f.title} className="why-feature">
                    <div className="why-icon">{f.icon}</div>
                    <div>
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="why-image">
              <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80" alt="Professional service" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED PROFESSIONALS ===== */}
      {professionals.length > 0 && (
        <section className="section professionals-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Meet Our Top Professionals</h2>
              <p className="section-subtitle">Highly rated experts ready to serve you</p>
            </div>
            <div className="grid-4">
              {professionals.map((p) => (
                <ProfessionalCard key={p._id} professional={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Real reviews from real homeowners</p>
          </div>
          <div className="grid-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card card">
                <div className="testimonial-stars">
                  {Array.from({ length: t.rating }, (_, i) => (
                    <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="section faq-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Got questions? We have answers.</p>
          </div>
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openFaq === i && <p className="faq-answer">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="container cta-content">
          <div>
            <h2>Ready to Book a Service?</h2>
            <p>Join thousands of happy homeowners who trust HomeEase for all their home service needs.</p>
          </div>
          <div className="cta-buttons">
            <Link to="/services" className="btn btn-primary btn-lg">Browse Services</Link>
            <Link to="/register" className="btn btn-secondary btn-lg" style={{ background: 'transparent', color: '#fff', borderColor: '#fff' }}>
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
