const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const store   = require('./data/store');

dotenv.config();

const app    = express();
const SECRET = process.env.JWT_SECRET || 'homeease_secret';

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// ─── Helpers ────────────────────────────────────────────────
const genToken = (id) => jwt.sign({ id }, SECRET, { expiresIn: '7d' });

const safeUser = (u) => ({
  _id: u._id, name: u.name, email: u.email,
  phone: u.phone, role: u.role, profileImage: u.profileImage,
  addresses: u.addresses, isActive: u.isActive, createdAt: u.createdAt,
});

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Not authorized' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], SECRET);
    const user = store.users.find(u => u._id === decoded.id);
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next()
  : res.status(403).json({ success: false, message: 'Admins only' });

const proOnly = (req, res, next) =>
  ['professional','admin'].includes(req.user?.role) ? next()
  : res.status(403).json({ success: false, message: 'Professionals only' });

// populate category object into a service
const populateService = (s) => ({
  ...s,
  category: store.categories.find(c => c._id === s.category) || s.category,
});

// populate userId into a professional
const populatePro = (p) => ({
  ...p,
  userId: safeUser(store.users.find(u => u._id === p.userId) || {}),
  serviceCategories: p.serviceCategories.map(id =>
    store.categories.find(c => c._id === id) || { _id: id }),
});

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  if (store.users.find(u => u.email === email.toLowerCase()))
    return res.status(400).json({ success: false, message: 'Email already registered' });

  const allowedRoles = ['customer','professional'];
  const userRole = allowedRoles.includes(role) ? role : 'customer';
  const hashed = await bcrypt.hash(password, 10);
  const user = {
    _id: store.newId(), name, email: email.toLowerCase(), phone: phone || '',
    password: hashed, role: userRole, profileImage: '', addresses: [],
    isActive: true, createdAt: new Date(),
  };
  store.users.push(user);
  res.status(201).json({ success: true, message: 'Registration successful', token: genToken(user._id), user: safeUser(user) });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });
  const user = store.users.find(u => u.email === email.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  if (!user.isActive)
    return res.status(403).json({ success: false, message: 'Account deactivated' });
  res.json({ success: true, message: 'Login successful', token: genToken(user._id), user: safeUser(user) });
});

// GET /api/auth/me
app.get('/api/auth/me', auth, (req, res) => {
  const professionalProfile = req.user.role === 'professional'
    ? populatePro(store.professionals.find(p => p.userId === req.user._id) || {})
    : null;
  res.json({ success: true, user: safeUser(req.user), professionalProfile });
});

// PUT /api/auth/profile
app.put('/api/auth/profile', auth, (req, res) => {
  const { name, phone, profileImage } = req.body;
  const user = store.users.find(u => u._id === req.user._id);
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (profileImage !== undefined) user.profileImage = profileImage;
  res.json({ success: true, message: 'Profile updated', user: safeUser(user) });
});

// PUT /api/auth/change-password
app.put('/api/auth/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = store.users.find(u => u._id === req.user._id);
  if (!(await bcrypt.compare(currentPassword, user.password)))
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  user.password = await bcrypt.hash(newPassword, 10);
  res.json({ success: true, message: 'Password changed successfully' });
});

// POST /api/auth/address
app.post('/api/auth/address', auth, (req, res) => {
  const user = store.users.find(u => u._id === req.user._id);
  const { label, street, city, state, zipCode, isDefault } = req.body;
  if (isDefault) user.addresses.forEach(a => a.isDefault = false);
  user.addresses.push({ _id: store.newId(), label: label || 'Home', street, city, state, zipCode: zipCode || '', isDefault: !!isDefault });
  res.json({ success: true, message: 'Address added', addresses: user.addresses });
});

// DELETE /api/auth/address/:addressId
app.delete('/api/auth/address/:addressId', auth, (req, res) => {
  const user = store.users.find(u => u._id === req.user._id);
  user.addresses = user.addresses.filter(a => a._id !== req.params.addressId);
  res.json({ success: true, message: 'Address removed', addresses: user.addresses });
});

// ══════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════

app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: store.categories.filter(c => c.isActive) });
});

app.post('/api/categories', auth, adminOnly, (req, res) => {
  const cat = { _id: store.newId(), ...req.body, isActive: true };
  store.categories.push(cat);
  res.status(201).json({ success: true, category: cat });
});

app.put('/api/categories/:id', auth, adminOnly, (req, res) => {
  const cat = store.categories.find(c => c._id === req.params.id);
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
  Object.assign(cat, req.body);
  res.json({ success: true, category: cat });
});

app.delete('/api/categories/:id', auth, adminOnly, (req, res) => {
  const idx = store.categories.findIndex(c => c._id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  store.categories.splice(idx, 1);
  res.json({ success: true, message: 'Category deleted' });
});

// ══════════════════════════════════════════════════════════════
//  SERVICES
// ══════════════════════════════════════════════════════════════

app.get('/api/services/featured', (req, res) => {
  const list = store.services.filter(s => s.isActive && s.isFeatured).map(populateService);
  res.json({ success: true, services: list });
});

app.get('/api/services', (req, res) => {
  const { search, category, minPrice, maxPrice, minRating, sort, page = 1, limit = 12 } = req.query;
  let list = store.services.filter(s => s.isActive);

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(s => s.serviceName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }
  if (category) list = list.filter(s => s.category === category);
  if (minPrice)  list = list.filter(s => s.price >= Number(minPrice));
  if (maxPrice)  list = list.filter(s => s.price <= Number(maxPrice));
  if (minRating) list = list.filter(s => s.avgRating >= Number(minRating));

  if (sort === 'price_asc')  list.sort((a,b) => a.price - b.price);
  else if (sort === 'price_desc') list.sort((a,b) => b.price - a.price);
  else if (sort === 'rating')     list.sort((a,b) => b.avgRating - a.avgRating);
  else if (sort === 'popular')    list.sort((a,b) => b.totalBookings - a.totalBookings);

  const total = list.length;
  const p = Number(page), l = Number(limit);
  const paged = list.slice((p-1)*l, p*l).map(populateService);

  res.json({ success: true, services: paged, total, totalPages: Math.ceil(total/l), currentPage: p });
});

app.get('/api/services/:id', (req, res) => {
  const s = store.services.find(s => s._id === req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, service: populateService(s) });
});

app.post('/api/services', auth, adminOnly, (req, res) => {
  const svc = { _id: store.newId(), ...req.body, isActive: true, totalBookings: 0, avgRating: 0, totalReviews: 0, createdAt: new Date() };
  store.services.push(svc);
  res.status(201).json({ success: true, service: populateService(svc) });
});

app.put('/api/services/:id', auth, adminOnly, (req, res) => {
  const svc = store.services.find(s => s._id === req.params.id);
  if (!svc) return res.status(404).json({ success: false, message: 'Service not found' });
  Object.assign(svc, req.body);
  res.json({ success: true, service: populateService(svc) });
});

app.delete('/api/services/:id', auth, adminOnly, (req, res) => {
  const idx = store.services.findIndex(s => s._id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  store.services.splice(idx, 1);
  res.json({ success: true, message: 'Service deleted' });
});

// ══════════════════════════════════════════════════════════════
//  PROFESSIONALS
// ══════════════════════════════════════════════════════════════

app.get('/api/professionals', (req, res) => {
  const { category, minRating, page = 1, limit = 12, sort } = req.query;
  let list = store.professionals.filter(p => p.isActive && p.verificationStatus === 'verified');
  if (category) list = list.filter(p => p.serviceCategories.includes(category));
  if (minRating) list = list.filter(p => p.rating >= Number(minRating));
  if (sort === 'jobs')       list.sort((a,b) => b.completedJobs - a.completedJobs);
  else if (sort === 'experience') list.sort((a,b) => b.experience - a.experience);
  else list.sort((a,b) => b.rating - a.rating);

  const total = list.length;
  const p = Number(page), l = Number(limit);
  const paged = list.slice((p-1)*l, p*l).map(populatePro);
  res.json({ success: true, professionals: paged, total, totalPages: Math.ceil(total/l), currentPage: p });
});

app.get('/api/professionals/my-profile', auth, proOnly, (req, res) => {
  const pro = store.professionals.find(p => p.userId === req.user._id);
  if (!pro) return res.status(404).json({ success: false, message: 'Professional profile not found' });
  res.json({ success: true, professional: populatePro(pro) });
});

app.get('/api/professionals/by-service/:serviceId', (req, res) => {
  const svc = store.services.find(s => s._id === req.params.serviceId);
  if (!svc) return res.status(404).json({ success: false, message: 'Service not found' });
  const list = store.professionals
    .filter(p => p.isActive && p.verificationStatus === 'verified' && p.serviceCategories.includes(svc.category))
    .map(populatePro);
  res.json({ success: true, professionals: list });
});

app.get('/api/professionals/:id', (req, res) => {
  const pro = store.professionals.find(p => p._id === req.params.id);
  if (!pro) return res.status(404).json({ success: false, message: 'Professional not found' });
  res.json({ success: true, professional: populatePro(pro) });
});

app.put('/api/professionals/profile', auth, proOnly, (req, res) => {
  let pro = store.professionals.find(p => p.userId === req.user._id);
  if (!pro) {
    pro = { _id: store.newId(), userId: req.user._id, serviceCategories: [], experience: 0, rating: 0, totalReviews: 0, completedJobs: 0, verificationStatus: 'pending', isActive: true, availability: [], isAvailableToday: true };
    store.professionals.push(pro);
  }
  const { experience, description, skills, hourlyRate, location, serviceCategories } = req.body;
  if (experience !== undefined) pro.experience = experience;
  if (description !== undefined) pro.description = description;
  if (skills !== undefined) pro.skills = skills;
  if (hourlyRate !== undefined) pro.hourlyRate = hourlyRate;
  if (location !== undefined) pro.location = location;
  if (serviceCategories !== undefined) pro.serviceCategories = serviceCategories;
  res.json({ success: true, professional: populatePro(pro) });
});

app.put('/api/professionals/availability', auth, proOnly, (req, res) => {
  const pro = store.professionals.find(p => p.userId === req.user._id);
  if (!pro) return res.status(404).json({ success: false, message: 'Profile not found' });
  const { availability, isAvailableToday } = req.body;
  if (availability) pro.availability = availability;
  if (isAvailableToday !== undefined) pro.isAvailableToday = isAvailableToday;
  res.json({ success: true, professional: populatePro(pro) });
});

// ══════════════════════════════════════════════════════════════
//  BOOKINGS
// ══════════════════════════════════════════════════════════════

app.get('/api/bookings/available-slots', (req, res) => {
  const { professionalId, date } = req.query;
  const allSlots = ['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM'];
  if (!professionalId || !date) return res.json({ success: true, availableSlots: allSlots, bookedSlots: [] });

  const dayStr = date.split('T')[0];
  const booked = store.bookings
    .filter(b => b.professionalId === professionalId && b.bookingStatus !== 'cancelled' && b.appointmentDate.startsWith(dayStr))
    .map(b => b.timeSlot);

  res.json({ success: true, availableSlots: allSlots.filter(s => !booked.includes(s)), bookedSlots: booked });
});

app.post('/api/bookings', auth, (req, res) => {
  if (req.user.role !== 'customer')
    return res.status(403).json({ success: false, message: 'Only customers can book' });

  const { serviceId, professionalId, appointmentDate, timeSlot, address, instructions, paymentMethod } = req.body;

  const svc = store.services.find(s => s._id === serviceId);
  if (!svc) return res.status(404).json({ success: false, message: 'Service not found' });
  const pro = store.professionals.find(p => p._id === professionalId);
  if (!pro) return res.status(404).json({ success: false, message: 'Professional not found' });

  if (new Date(appointmentDate) < new Date())
    return res.status(400).json({ success: false, message: 'Cannot book in the past' });

  const dayStr = appointmentDate.split('T')[0];
  const conflict = store.bookings.find(b =>
    b.professionalId === professionalId &&
    b.timeSlot === timeSlot &&
    b.appointmentDate.startsWith(dayStr) &&
    b.bookingStatus !== 'cancelled'
  );
  if (conflict) return res.status(400).json({ success: false, message: 'This time slot is already booked' });

  const booking = {
    _id: store.newId(),
    bookingId: store.bookingId(),
    customerId: req.user._id,
    professionalId,
    serviceId,
    appointmentDate: dayStr,
    timeSlot,
    address,
    instructions: instructions || '',
    servicePrice: svc.price,
    additionalCharges: 0,
    totalAmount: svc.price,
    bookingStatus: 'pending',
    paymentStatus: 'paid',
    paymentMethod: paymentMethod || 'demo',
    hasReview: false,
    statusHistory: [{ status: 'pending', changedAt: new Date(), changedBy: req.user.name, note: 'Booking created' }],
    createdAt: new Date(),
  };
  store.bookings.push(booking);
  svc.totalBookings = (svc.totalBookings || 0) + 1;

  // Populate response
  const populated = {
    ...booking,
    serviceId: populateService(svc),
    professionalId: populatePro(pro),
    customerId: safeUser(req.user),
  };
  res.status(201).json({ success: true, message: 'Booking created successfully', booking: populated });
});

app.get('/api/bookings/my-bookings', auth, (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  let list = store.bookings.filter(b => b.customerId === req.user._id);
  if (status) list = list.filter(b => b.bookingStatus === status);
  list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = list.length;
  const p = Number(page), l = Number(limit);
  const paged = list.slice((p-1)*l, p*l).map(b => ({
    ...b,
    serviceId: populateService(store.services.find(s => s._id === b.serviceId) || { serviceName: 'Service', _id: b.serviceId }),
    professionalId: populatePro(store.professionals.find(pr => pr._id === b.professionalId) || { userId: 'u1', serviceCategories: [] }),
  }));

  res.json({ success: true, bookings: paged, total, totalPages: Math.ceil(total/l), currentPage: p });
});

app.get('/api/bookings/professional-bookings', auth, proOnly, (req, res) => {
  const pro = store.professionals.find(p => p.userId === req.user._id);
  if (!pro) return res.status(404).json({ success: false, message: 'Professional profile not found' });

  const { status, page = 1, limit = 10 } = req.query;
  let list = store.bookings.filter(b => b.professionalId === pro._id);
  if (status) list = list.filter(b => b.bookingStatus === status);
  list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = list.length;
  const p = Number(page), l = Number(limit);
  const paged = list.slice((p-1)*l, p*l).map(b => ({
    ...b,
    serviceId: populateService(store.services.find(s => s._id === b.serviceId) || { serviceName: 'Service', _id: b.serviceId }),
    customerId: safeUser(store.users.find(u => u._id === b.customerId) || { name: 'Customer', _id: b.customerId }),
  }));

  res.json({ success: true, bookings: paged, total, totalPages: Math.ceil(total/l), currentPage: p });
});

app.get('/api/bookings/:id', auth, (req, res) => {
  const b = store.bookings.find(b => b._id === req.params.id);
  if (!b) return res.status(404).json({ success: false, message: 'Booking not found' });
  const isCustomer = b.customerId === req.user._id;
  const pro = store.professionals.find(p => p._id === b.professionalId);
  const isPro = pro && pro.userId === req.user._id;
  if (!isCustomer && !isPro && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Access denied' });

  res.json({ success: true, booking: {
    ...b,
    serviceId: populateService(store.services.find(s => s._id === b.serviceId) || {}),
    professionalId: pro ? populatePro(pro) : b.professionalId,
    customerId: safeUser(store.users.find(u => u._id === b.customerId) || {}),
  }});
});

app.put('/api/bookings/:id/status', auth, proOnly, (req, res) => {
  const b = store.bookings.find(b => b._id === req.params.id);
  if (!b) return res.status(404).json({ success: false, message: 'Booking not found' });
  const { status, note } = req.body;
  b.bookingStatus = status;
  if (status === 'completed') {
    b.completedAt = new Date();
    const pro = store.professionals.find(p => p._id === b.professionalId);
    if (pro) pro.completedJobs = (pro.completedJobs || 0) + 1;
  }
  b.statusHistory.push({ status, changedAt: new Date(), changedBy: req.user.name, note: note || '' });
  res.json({ success: true, message: `Status updated to ${status}`, booking: b });
});

app.put('/api/bookings/:id/cancel', auth, (req, res) => {
  const b = store.bookings.find(b => b._id === req.params.id);
  if (!b) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (b.customerId !== req.user._id && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Access denied' });
  if (!['pending','confirmed'].includes(b.bookingStatus))
    return res.status(400).json({ success: false, message: `Cannot cancel a ${b.bookingStatus} booking` });

  const { reason } = req.body;
  b.bookingStatus = 'cancelled';
  b.cancellationReason = reason || 'Cancelled by customer';
  b.cancelledBy = req.user.role === 'admin' ? 'admin' : 'customer';
  b.statusHistory.push({ status: 'cancelled', changedAt: new Date(), changedBy: req.user.name, note: reason || '' });
  res.json({ success: true, message: 'Booking cancelled', booking: b });
});

// ══════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════

app.post('/api/reviews', auth, (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const booking = store.bookings.find(b => b._id === bookingId);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (booking.customerId !== req.user._id)
    return res.status(403).json({ success: false, message: 'Not your booking' });
  if (booking.bookingStatus !== 'completed')
    return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
  if (booking.hasReview)
    return res.status(400).json({ success: false, message: 'Already reviewed' });

  const review = {
    _id: store.newId(), customerId: req.user._id, professionalId: booking.professionalId,
    bookingId, serviceId: booking.serviceId, rating, comment, isVisible: true, createdAt: new Date(),
  };
  store.reviews.push(review);
  booking.hasReview = true;

  // Update professional rating
  const proReviews = store.reviews.filter(r => r.professionalId === booking.professionalId);
  const avg = proReviews.reduce((a,r) => a + r.rating, 0) / proReviews.length;
  const pro = store.professionals.find(p => p._id === booking.professionalId);
  if (pro) { pro.rating = Math.round(avg * 10) / 10; pro.totalReviews = proReviews.length; }

  res.status(201).json({ success: true, message: 'Review submitted', review: { ...review, customerId: safeUser(req.user) } });
});

app.get('/api/reviews/:professionalId', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const list = store.reviews
    .filter(r => r.professionalId === req.params.professionalId && r.isVisible)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = list.length;
  const p = Number(page), l = Number(limit);
  const paged = list.slice((p-1)*l, p*l).map(r => ({
    ...r,
    customerId: safeUser(store.users.find(u => u._id === r.customerId) || { name: 'Customer' }),
  }));
  res.json({ success: true, reviews: paged, total, totalPages: Math.ceil(total/l) });
});

// ══════════════════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════════════════

app.get('/api/admin/dashboard', auth, adminOnly, (req, res) => {
  const bkgs = store.bookings;
  const completed = bkgs.filter(b => b.bookingStatus === 'completed');
  const totalRevenue = completed.reduce((a,b) => a + b.totalAmount, 0);

  const bookingsByStatus = ['pending','confirmed','professional_assigned','in_progress','completed','cancelled'].map(s => ({
    _id: s, count: bkgs.filter(b => b.bookingStatus === s).length,
  })).filter(x => x.count > 0);

  const recentBookings = [...bkgs].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10).map(b => ({
    ...b,
    customerId: safeUser(store.users.find(u => u._id === b.customerId) || {}),
    serviceId: store.services.find(s => s._id === b.serviceId) || {},
  }));

  res.json({
    success: true,
    stats: {
      totalCustomers:     store.users.filter(u => u.role === 'customer').length,
      totalProfessionals: store.users.filter(u => u.role === 'professional').length,
      totalServices:      store.services.filter(s => s.isActive).length,
      totalBookings:      bkgs.length,
      completedBookings:  completed.length,
      pendingBookings:    bkgs.filter(b => b.bookingStatus === 'pending').length,
      totalCategories:    store.categories.filter(c => c.isActive).length,
      totalRevenue,
    },
    recentBookings,
    bookingsByStatus,
    monthlyRevenue: [],
  });
});

app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  let list = [...store.users];
  if (role) list = list.filter(u => u.role === role);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  const total = list.length;
  const p = Number(page), l = Number(limit);
  res.json({ success: true, users: list.slice((p-1)*l, p*l).map(safeUser), total });
});

app.get('/api/admin/bookings', auth, adminOnly, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let list = [...store.bookings];
  if (status) list = list.filter(b => b.bookingStatus === status);
  list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = list.length;
  const p = Number(page), l = Number(limit);
  const paged = list.slice((p-1)*l, p*l).map(b => ({
    ...b,
    customerId: safeUser(store.users.find(u => u._id === b.customerId) || {}),
    serviceId: store.services.find(s => s._id === b.serviceId) || {},
    professionalId: (() => {
      const pro = store.professionals.find(pr => pr._id === b.professionalId);
      return pro ? { ...pro, userId: safeUser(store.users.find(u => u._id === pro.userId) || {}) } : null;
    })(),
  }));
  res.json({ success: true, bookings: paged, total, totalPages: Math.ceil(total/l) });
});

app.get('/api/admin/professionals', auth, adminOnly, (req, res) => {
  const { verificationStatus } = req.query;
  let list = [...store.professionals];
  if (verificationStatus) list = list.filter(p => p.verificationStatus === verificationStatus);
  res.json({ success: true, professionals: list.map(populatePro), total: list.length });
});

app.put('/api/admin/users/:id/toggle-status', auth, adminOnly, (req, res) => {
  const user = store.users.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = !user.isActive;
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: safeUser(user) });
});

app.put('/api/admin/professionals/:id/verify', auth, adminOnly, (req, res) => {
  const pro = store.professionals.find(p => p._id === req.params.id);
  if (!pro) return res.status(404).json({ success: false, message: 'Professional not found' });
  pro.verificationStatus = req.body.status;
  res.json({ success: true, professional: populatePro(pro) });
});

app.get('/api/admin/revenue', auth, adminOnly, (req, res) => {
  const completed = store.bookings.filter(b => b.bookingStatus === 'completed');
  const total = completed.reduce((a,b) => a + b.totalAmount, 0);
  const serviceMap = {};
  completed.forEach(b => {
    if (!serviceMap[b.serviceId]) serviceMap[b.serviceId] = { revenue: 0, count: 0 };
    serviceMap[b.serviceId].revenue += b.totalAmount;
    serviceMap[b.serviceId].count   += 1;
  });
  const topServices = Object.entries(serviceMap)
    .map(([id, v]) => ({ _id: id, ...v, service: [store.services.find(s => s._id === id)] }))
    .sort((a,b) => b.revenue - a.revenue).slice(0, 5);

  res.json({ success: true, totalRevenue: total, totalCompletedBookings: completed.length, topServices });
});

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'HomeEase API running (no-DB mode)', timestamp: new Date() }));

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` }));

// ─── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) =>
  res.status(500).json({ success: false, message: err.message || 'Server error' }));

// ─── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏠 HomeEase Server running on port ${PORT}`);
  console.log(`✅ No database required — using in-memory data store`);
  console.log(`🔗 http://localhost:${PORT}/api/health\n`);
  console.log('📋 Test Credentials:');
  console.log('   Admin:    admin@homeease.com    / password123');
  console.log('   Customer: john@homeease.com     / password123');
  console.log('   Pro:      michael@homeease.com  / password123\n');
});
