import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const services = ['Plumbing', 'Electrical Services', 'Home Cleaning', 'AC Repair', 'Painting', 'Carpentry'];

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span>🏠</span> HomeEase
            </Link>
            <p>Your trusted platform for booking professional home services. Quality work, guaranteed.</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/services">All Services</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-col">
            <h4>Our Services</h4>
            <ul>
              {services.map((s) => (
                <li key={s}><Link to="/services">{s}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact Us</h4>
            <div className="footer-contact">
              <div className="contact-item">
                <MapPin size={16} />
                <span>123 Main Street, New York, NY 10001</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>+1 (800) 123-4567</span>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <span>support@homeease.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} HomeEase. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
