import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Calendar, Clock, MapPin, User, FileText, CreditCard, CheckCircle } from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { professionalService, bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Booking.css';

const STEPS = ['Service', 'Professional', 'Date & Time', 'Address', 'Review', 'Confirm'];

const TIME_SLOTS = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

const Booking = () => {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(TIME_SLOTS);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    professionalId: searchParams.get('professional') || '',
    date: '',
    timeSlot: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: '',
  });

  const updateForm = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    const load = async () => {
      try {
        const [svcRes, proRes] = await Promise.all([
          serviceService.getById(serviceId),
          professionalService.getByService(serviceId),
        ]);
        setService(svcRes.data.service);
        setProfessionals(proRes.data.professionals || []);
        if (form.professionalId && step === 0) setStep(1);
      } catch {
        toast.error('Service not found');
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [serviceId]);

  useEffect(() => {
    if (form.professionalId && form.date) {
      bookingService.getAvailableSlots({ professionalId: form.professionalId, date: form.date })
        .then((res) => {
          setAvailableSlots(res.data.availableSlots || TIME_SLOTS);
          setBookedSlots(res.data.bookedSlots || []);
        })
        .catch(() => {
          setAvailableSlots(TIME_SLOTS);
        });
    }
  }, [form.professionalId, form.date]);

  const selectedPro = professionals.find((p) => p._id === form.professionalId);

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    // Guard: make sure user is still logged in before submitting
    const token = localStorage.getItem('homeease_token');
    if (!token) {
      toast.error('Your session has expired. Please log in again.');
      navigate('/login', { state: { from: { pathname: `/booking/${serviceId}` } } });
      return;
    }

    setSubmitting(true);
    try {
      const res = await bookingService.create({
        serviceId,
        professionalId: form.professionalId,
        appointmentDate: form.date,
        timeSlot: form.timeSlot,
        address: { street: form.street, city: form.city, state: form.state, zipCode: form.zipCode },
        instructions: form.instructions,
        paymentMethod: 'demo',
      });
      setConfirmedBooking(res.data.booking);
      setStep(5);
      toast.success('Booking confirmed successfully!');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Booking failed. Please try again.';

      if (status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/login', { state: { from: { pathname: `/booking/${serviceId}` } } });
      } else if (status === 403) {
        toast.error('You must be logged in as a customer to book services.');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!service;
    if (step === 1) return !!form.professionalId;
    if (step === 2) return form.date && form.timeSlot;
    if (step === 3) return form.street && form.city && form.state;
    return true;
  };

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Success screen
  if (step === 5 && confirmedBooking) {
    return (
      <div className="booking-success">
        <div className="success-card">
          <div className="success-icon"><CheckCircle size={64} /></div>
          <h2>Booking Confirmed!</h2>
          <p>Your service has been booked successfully.</p>
          <div className="success-booking-id">
            Booking ID: <strong>{confirmedBooking.bookingId}</strong>
          </div>
          <div className="success-details">
            <div className="success-detail"><Calendar size={16} /><span>{new Date(confirmedBooking.appointmentDate).toLocaleDateString()}</span></div>
            <div className="success-detail"><Clock size={16} /><span>{confirmedBooking.timeSlot}</span></div>
          </div>
          <div className="success-actions">
            <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>View My Bookings</button>
            <button className="btn btn-secondary" onClick={() => navigate('/services')}>Book Another Service</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="container booking-container">
        {/* Progress Steps */}
        <div className="booking-steps">
          {STEPS.slice(0, 5).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`booking-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                <div className="step-circle">
                  {i < step ? <Check size={14} /> : <span>{i + 1}</span>}
                </div>
                <span className="step-label">{s}</span>
              </div>
              {i < STEPS.length - 2 && <div className={`step-connector ${i < step ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="booking-layout">
          {/* Step Content */}
          <div className="booking-content">
            {/* Step 0: Service */}
            {step === 0 && service && (
              <div className="booking-step-panel">
                <h2><span className="step-tag">Step 1</span> Selected Service</h2>
                <div className="selected-service-card">
                  <div className="selected-service-info">
                    <h3>{service.serviceName}</h3>
                    <p>{service.shortDescription || service.description?.substring(0, 120)}...</p>
                    <div className="selected-service-meta">
                      <span><Clock size={14} /> {service.duration} min</span>
                      <span className="price-tag">Starting ${service.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Professional */}
            {step === 1 && (
              <div className="booking-step-panel">
                <h2><span className="step-tag">Step 2</span> Choose a Professional</h2>
                {professionals.length === 0 ? (
                  <div className="empty-state">
                    <p>No professionals available for this service at the moment.</p>
                  </div>
                ) : (
                  <div className="pro-selection-grid">
                    {professionals.map((p) => {
                      const pUser = p.userId || {};
                      const isSelected = form.professionalId === p._id;
                      return (
                        <div
                          key={p._id}
                          className={`pro-select-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => updateForm('professionalId', p._id)}
                        >
                          <div className="pro-select-avatar">
                            {pUser.profileImage
                              ? <img src={pUser.profileImage} alt={pUser.name} />
                              : <span>{pUser.name?.charAt(0) || 'P'}</span>
                            }
                          </div>
                          <div className="pro-select-info">
                            <h4>{pUser.name}</h4>
                            <p>{p.experience} years exp. · {p.completedJobs} jobs</p>
                            <div className="pro-select-rating">
                              ⭐ {(p.rating || 0).toFixed(1)} ({p.totalReviews || 0} reviews)
                            </div>
                          </div>
                          <div className="pro-select-meta">
                            {p.hourlyRate && <span className="pro-rate">${p.hourlyRate}/hr</span>}
                            {isSelected && <div className="pro-check"><Check size={16} /></div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="booking-step-panel">
                <h2><span className="step-tag">Step 3</span> Select Date & Time</h2>
                <div className="date-picker-section">
                  <label className="form-label">Appointment Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    min={getMinDate()}
                    onChange={(e) => updateForm('date', e.target.value)}
                    style={{ maxWidth: '280px' }}
                  />
                </div>
                {form.date && (
                  <div className="time-slots-section">
                    <label className="form-label">Available Time Slots</label>
                    <div className="time-slots-grid">
                      {TIME_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = form.timeSlot === slot;
                        return (
                          <button
                            key={slot}
                            className={`time-slot ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                            onClick={() => !isBooked && updateForm('timeSlot', slot)}
                            disabled={isBooked}
                          >
                            {slot}
                            {isBooked && <span className="booked-label">Booked</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Address */}
            {step === 3 && (
              <div className="booking-step-panel">
                <h2><span className="step-tag">Step 4</span> Service Address</h2>
                <div className="address-form">
                  <div className="form-group">
                    <label className="form-label">Street Address *</label>
                    <input
                      className="form-input"
                      placeholder="123 Main Street, Apt 4B"
                      value={form.street}
                      onChange={(e) => updateForm('street', e.target.value)}
                    />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input className="form-input" placeholder="New York" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input className="form-input" placeholder="NY" value={form.state} onChange={(e) => updateForm('state', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ZIP Code</label>
                    <input className="form-input" placeholder="10001" value={form.zipCode} onChange={(e) => updateForm('zipCode', e.target.value)} style={{ maxWidth: '200px' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Additional Instructions</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Any special instructions for the professional..."
                      value={form.instructions}
                      onChange={(e) => updateForm('instructions', e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="booking-step-panel">
                <h2><span className="step-tag">Step 5</span> Review Your Booking</h2>
                <div className="review-section">
                  <div className="review-row">
                    <div className="review-label"><FileText size={16} /> Service</div>
                    <div className="review-value">{service?.serviceName}</div>
                  </div>
                  <div className="review-row">
                    <div className="review-label"><User size={16} /> Professional</div>
                    <div className="review-value">{selectedPro?.userId?.name || 'Selected Professional'}</div>
                  </div>
                  <div className="review-row">
                    <div className="review-label"><Calendar size={16} /> Date</div>
                    <div className="review-value">{new Date(form.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                  <div className="review-row">
                    <div className="review-label"><Clock size={16} /> Time</div>
                    <div className="review-value">{form.timeSlot}</div>
                  </div>
                  <div className="review-row">
                    <div className="review-label"><MapPin size={16} /> Address</div>
                    <div className="review-value">{form.street}, {form.city}, {form.state} {form.zipCode}</div>
                  </div>
                  {form.instructions && (
                    <div className="review-row">
                      <div className="review-label"><FileText size={16} /> Instructions</div>
                      <div className="review-value">{form.instructions}</div>
                    </div>
                  )}
                  <div className="review-price-box">
                    <div className="price-breakdown">
                      <div className="price-line">
                        <span>Service Price</span>
                        <span>${service?.price}</span>
                      </div>
                      <div className="price-line">
                        <span>Additional Charges</span>
                        <span>$0</span>
                      </div>
                      <div className="price-total">
                        <span>Total Amount</span>
                        <strong>${service?.price}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="demo-payment-notice">
                    <CreditCard size={16} />
                    <div>
                      <strong>Demo Payment</strong>
                      <p>This is a demo booking. No real payment will be processed.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 5 && (
              <div className="booking-nav">
                {step > 0 && (
                  <button className="btn btn-secondary" onClick={() => setStep((s) => s - 1)}>
                    Back
                  </button>
                )}
                {step < 4 ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canNext()}
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <aside className="booking-summary">
            <div className="summary-card card">
              <h3>Booking Summary</h3>
              <div className="summary-item">
                <span className="summary-label">Service</span>
                <span className="summary-value">{service?.serviceName}</span>
              </div>
              {selectedPro && (
                <div className="summary-item">
                  <span className="summary-label">Professional</span>
                  <span className="summary-value">{selectedPro.userId?.name}</span>
                </div>
              )}
              {form.date && (
                <div className="summary-item">
                  <span className="summary-label">Date</span>
                  <span className="summary-value">{new Date(form.date).toLocaleDateString()}</span>
                </div>
              )}
              {form.timeSlot && (
                <div className="summary-item">
                  <span className="summary-label">Time</span>
                  <span className="summary-value">{form.timeSlot}</span>
                </div>
              )}
              <div className="summary-divider" />
              <div className="summary-total">
                <span>Total</span>
                <strong>${service?.price || 0}</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Booking;
