import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import './Contact.css';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    // Simulate submit
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    toast.success('Message sent! We will get back to you within 24 hours.');
  };

  return (
    <div className="contact-page">
      <div className="page-hero">
        <h1>Contact Us</h1>
        <p>Have questions or need help? We are here for you.</p>
      </div>

      <div className="container contact-container">
        <div className="contact-grid">
          {/* Info */}
          <div className="contact-info">
            <h2>Get In Touch</h2>
            <p>Our customer support team is available Monday through Saturday, 8 AM to 6 PM EST.</p>

            <div className="contact-items">
              <div className="contact-item-card">
                <div className="contact-item-icon"><Phone size={20} /></div>
                <div>
                  <strong>Phone</strong>
                  <span>+1 (800) 123-4567</span>
                </div>
              </div>
              <div className="contact-item-card">
                <div className="contact-item-icon"><Mail size={20} /></div>
                <div>
                  <strong>Email</strong>
                  <span>support@homeease.com</span>
                </div>
              </div>
              <div className="contact-item-card">
                <div className="contact-item-icon"><MapPin size={20} /></div>
                <div>
                  <strong>Office</strong>
                  <span>123 Main Street, New York, NY 10001</span>
                </div>
              </div>
              <div className="contact-item-card">
                <div className="contact-item-icon"><Clock size={20} /></div>
                <div>
                  <strong>Support Hours</strong>
                  <span>Mon–Sat: 8 AM – 6 PM EST</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-box card">
            {submitted ? (
              <div className="contact-success">
                <CheckCircle size={56} style={{ color: 'var(--success)' }} />
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. We will respond within 24 hours.</p>
                <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h3>Send Us a Message</h3>
                <form onSubmit={handleSubmit}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Smith" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input type="email" className="form-input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select className="form-input" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}>
                      <option value="">Select a topic</option>
                      <option>Booking Support</option>
                      <option>Professional Inquiry</option>
                      <option>Technical Issue</option>
                      <option>Billing Question</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message *</label>
                    <textarea className="form-input" rows={5} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Tell us how we can help you..." style={{ resize: 'vertical' }} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                    {loading ? 'Sending...' : <><Send size={16} /> Send Message</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
