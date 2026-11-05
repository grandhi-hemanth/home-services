const bcrypt = require('bcryptjs');

// ─── ID generator ───────────────────────────────────────────
let _counter = 1;
const newId = () => `id_${Date.now()}_${_counter++}`;

const bookingId = () => {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HE-${t}-${r}`;
};

// ─── Seed categories ────────────────────────────────────────
const categories = [
  { _id: 'cat1', categoryName: 'Plumbing',           icon: 'Wrench',     isActive: true, sortOrder: 1 },
  { _id: 'cat2', categoryName: 'Electrical Services', icon: 'Zap',        isActive: true, sortOrder: 2 },
  { _id: 'cat3', categoryName: 'Home Cleaning',       icon: 'Sparkles',   isActive: true, sortOrder: 3 },
  { _id: 'cat4', categoryName: 'AC Repair',           icon: 'Wind',       isActive: true, sortOrder: 4 },
  { _id: 'cat5', categoryName: 'Painting',            icon: 'Paintbrush', isActive: true, sortOrder: 5 },
  { _id: 'cat6', categoryName: 'Carpentry',           icon: 'Hammer',     isActive: true, sortOrder: 6 },
  { _id: 'cat7', categoryName: 'Pest Control',        icon: 'Bug',        isActive: true, sortOrder: 7 },
  { _id: 'cat8', categoryName: 'Appliance Repair',    icon: 'Settings',   isActive: true, sortOrder: 8 },
];

// ─── Seed services ──────────────────────────────────────────
const services = [
  { _id: 's1',  serviceName: 'Emergency Plumbing Repair',  category: 'cat1', description: 'Fast and reliable emergency plumbing repairs for burst pipes, severe leaks, clogged drains, and other urgent plumbing issues. Available 24/7.', shortDescription: 'Fast emergency plumbing repairs for urgent issues', price: 99,  priceType: 'starting_from', duration: 120, features: ['24/7 availability','Same-day service','All pipe types','Free inspection'], isActive: true, isFeatured: true,  totalBookings: 245, avgRating: 4.7, totalReviews: 89  },
  { _id: 's2',  serviceName: 'Full Home Plumbing Inspection', category: 'cat1', description: 'Comprehensive plumbing inspection covering all pipes, fixtures, water pressure, and drainage systems. Get a detailed report.', shortDescription: 'Complete inspection of your home plumbing system', price: 149, priceType: 'fixed',         duration: 180, features: ['Complete pipe check','Water pressure test','Leak detection','Written report'], isActive: true, isFeatured: false, totalBookings: 120, avgRating: 4.8, totalReviews: 45  },
  { _id: 's3',  serviceName: 'Electrical Panel Upgrade',    category: 'cat2', description: 'Safe and code-compliant electrical panel upgrades from 100A to 200A. Includes permit assistance and final inspection.', shortDescription: 'Upgrade your electrical panel safely and legally', price: 299, priceType: 'starting_from', duration: 240, features: ['Code compliant','Permit assistance','Safety inspection','1-year warranty'], isActive: true, isFeatured: true,  totalBookings: 89,  avgRating: 4.9, totalReviews: 34  },
  { _id: 's4',  serviceName: 'Home Wiring & Outlets',       category: 'cat2', description: 'Professional installation of new electrical outlets, switches, ceiling fans, and light fixtures.', shortDescription: 'New outlets, switches, and electrical installations', price: 129, priceType: 'starting_from', duration: 120, features: ['GFCI outlets','USB outlets','Smart switches','Dimmer installation'], isActive: true, isFeatured: false, totalBookings: 178, avgRating: 4.6, totalReviews: 67  },
  { _id: 's5',  serviceName: 'Deep Home Cleaning',          category: 'cat3', description: 'Thorough deep cleaning of your entire home including kitchen, bathrooms, bedrooms, and living areas. Eco-friendly products used.', shortDescription: 'Complete top-to-bottom deep cleaning service', price: 199, priceType: 'starting_from', duration: 240, features: ['Eco-friendly products','All rooms covered','Appliance cleaning','Bathroom sanitization'], isActive: true, isFeatured: true,  totalBookings: 432, avgRating: 4.8, totalReviews: 167 },
  { _id: 's6',  serviceName: 'Regular House Cleaning',      category: 'cat3', description: 'Weekly or bi-weekly house cleaning maintenance. Keep your home consistently clean with our professional team.', shortDescription: 'Regular scheduled cleaning for your home', price: 89,  priceType: 'starting_from', duration: 120, features: ['Flexible scheduling','Same team','Supplies included','Customizable checklist'], isActive: true, isFeatured: false, totalBookings: 689, avgRating: 4.7, totalReviews: 234 },
  { _id: 's7',  serviceName: 'AC Service & Maintenance',    category: 'cat4', description: 'Complete AC servicing including filter cleaning, refrigerant check, coil cleaning, and performance optimization.', shortDescription: 'Full AC tune-up and maintenance service', price: 79,  priceType: 'fixed',         duration: 90,  features: ['Filter cleaning','Refrigerant check','Coil cleaning','Performance report'], isActive: true, isFeatured: true,  totalBookings: 356, avgRating: 4.6, totalReviews: 145 },
  { _id: 's8',  serviceName: 'AC Repair & Diagnostics',     category: 'cat4', description: 'Expert diagnosis and repair of all AC problems. We fix cooling issues, strange noises, water leaks, and electrical faults.', shortDescription: 'Diagnose and fix all AC problems efficiently', price: 119, priceType: 'starting_from', duration: 120, features: ['All brands','Same-day service','Warranty on parts','Free diagnostic'], isActive: true, isFeatured: false, totalBookings: 212, avgRating: 4.5, totalReviews: 89  },
  { _id: 's9',  serviceName: 'Interior House Painting',     category: 'cat5', description: 'Professional interior painting services for rooms, walls, ceilings, and trim. Premium paints and perfect finish.', shortDescription: 'Professional interior painting for any room', price: 299, priceType: 'starting_from', duration: 480, features: ['Premium paints','Surface preparation','Color consultation','2-year warranty'], isActive: true, isFeatured: true,  totalBookings: 178, avgRating: 4.7, totalReviews: 56  },
  { _id: 's10', serviceName: 'Furniture Assembly & Repair', category: 'cat6', description: 'Expert furniture assembly for flat-pack furniture and repair of damaged furniture, cabinets, and woodwork.', shortDescription: 'Assembly and repair of all furniture types', price: 79,  priceType: 'starting_from', duration: 120, features: ['All brands','Tools provided','Same-day','Clean-up included'], isActive: true, isFeatured: true,  totalBookings: 456, avgRating: 4.6, totalReviews: 178 },
  { _id: 's11', serviceName: 'General Pest Control',        category: 'cat7', description: 'Comprehensive pest control treatment for cockroaches, ants, bed bugs, rodents, and other pests. Safe for family and pets.', shortDescription: 'Effective pest elimination for your entire home', price: 149, priceType: 'starting_from', duration: 120, features: ['Pet-safe products','All pests covered','90-day guarantee','Follow-up visit'], isActive: true, isFeatured: true,  totalBookings: 267, avgRating: 4.5, totalReviews: 112 },
  { _id: 's12', serviceName: 'Appliance Repair',            category: 'cat8', description: 'Professional repair for washing machines, dryers, refrigerators, dishwashers, ovens, and other home appliances.', shortDescription: 'Fix any home appliance quickly and affordably', price: 89,  priceType: 'starting_from', duration: 90,  features: ['All major brands','Genuine parts','6-month warranty','Same-day service'], isActive: true, isFeatured: true,  totalBookings: 389, avgRating: 4.6, totalReviews: 156 },
];

// ─── Seed users (passwords pre-hashed) ──────────────────────
// All passwords = "password123"
const HASHED = bcrypt.hashSync('password123', 10);

const users = [
  { _id: 'u1', name: 'Admin User',       email: 'admin@homeease.com',    phone: '+1234567890', password: HASHED, role: 'admin',        profileImage: '', addresses: [], isActive: true, createdAt: new Date('2024-01-01') },
  { _id: 'u2', name: 'John Smith',       email: 'john@homeease.com',     phone: '+1234567891', password: HASHED, role: 'customer',     profileImage: '', addresses: [], isActive: true, createdAt: new Date('2024-01-02') },
  { _id: 'u3', name: 'Emily Davis',      email: 'emily@homeease.com',    phone: '+1234567892', password: HASHED, role: 'customer',     profileImage: '', addresses: [], isActive: true, createdAt: new Date('2024-01-03') },
  { _id: 'u4', name: 'Michael Johnson',  email: 'michael@homeease.com',  phone: '+1234567893', password: HASHED, role: 'professional', profileImage: '', addresses: [], isActive: true, createdAt: new Date('2024-01-04') },
  { _id: 'u5', name: 'Robert Wilson',    email: 'robert@homeease.com',   phone: '+1234567894', password: HASHED, role: 'professional', profileImage: '', addresses: [], isActive: true, createdAt: new Date('2024-01-05') },
  { _id: 'u6', name: 'Sarah Brown',      email: 'sarah@homeease.com',    phone: '+1234567895', password: HASHED, role: 'professional', profileImage: '', addresses: [], isActive: true, createdAt: new Date('2024-01-06') },
  { _id: 'u7', name: 'David Martinez',   email: 'david@homeease.com',    phone: '+1234567896', password: HASHED, role: 'professional', profileImage: '', addresses: [], isActive: true, createdAt: new Date('2024-01-07') },
  { _id: 'u8', name: 'Jennifer Taylor',  email: 'jennifer@homeease.com', phone: '+1234567897', password: HASHED, role: 'professional', profileImage: '', addresses: [], isActive: true, createdAt: new Date('2024-01-08') },
];

const defaultAvailability = [
  { day: 'Monday',    startTime: '09:00', endTime: '18:00', isAvailable: true  },
  { day: 'Tuesday',   startTime: '09:00', endTime: '18:00', isAvailable: true  },
  { day: 'Wednesday', startTime: '09:00', endTime: '18:00', isAvailable: true  },
  { day: 'Thursday',  startTime: '09:00', endTime: '18:00', isAvailable: true  },
  { day: 'Friday',    startTime: '09:00', endTime: '18:00', isAvailable: true  },
  { day: 'Saturday',  startTime: '09:00', endTime: '14:00', isAvailable: true  },
  { day: 'Sunday',    startTime: '00:00', endTime: '00:00', isAvailable: false },
];

// ─── Seed professionals ─────────────────────────────────────
const professionals = [
  { _id: 'p1', userId: 'u4', serviceCategories: ['cat1'], experience: 8,  description: 'Certified master plumber with 8 years of experience in residential and commercial plumbing.', skills: ['Pipe Installation','Leak Detection','Drain Cleaning','Water Heater Repair'], rating: 4.8, totalReviews: 124, completedJobs: 312, hourlyRate: 75, verificationStatus: 'verified', availability: defaultAvailability, isAvailableToday: true,  isActive: true },
  { _id: 'p2', userId: 'u5', serviceCategories: ['cat2'], experience: 12, description: 'Licensed electrician specializing in residential wiring, panel upgrades, and smart home installations.', skills: ['Panel Upgrade','Wiring','Circuit Breaker','Smart Home'], rating: 4.9, totalReviews: 89,  completedJobs: 245, hourlyRate: 90, verificationStatus: 'verified', availability: defaultAvailability, isAvailableToday: true,  isActive: true },
  { _id: 'p3', userId: 'u6', serviceCategories: ['cat3'], experience: 5,  description: 'Professional home cleaning specialist with eco-friendly products and attention to detail.', skills: ['Deep Cleaning','Move-in/Move-out','Post-Construction','Regular Maintenance'], rating: 4.7, totalReviews: 156, completedJobs: 428, hourlyRate: 45, verificationStatus: 'verified', availability: defaultAvailability, isAvailableToday: true,  isActive: true },
  { _id: 'p4', userId: 'u7', serviceCategories: ['cat4','cat8'], experience: 10, description: 'HVAC certified technician offering AC repair, servicing, and appliance repair services.', skills: ['AC Installation','Refrigerant Refill','Duct Cleaning','Appliance Diagnostics'], rating: 4.6, totalReviews: 78, completedJobs: 189, hourlyRate: 80, verificationStatus: 'verified', availability: defaultAvailability, isAvailableToday: false, isActive: true },
  { _id: 'p5', userId: 'u8', serviceCategories: ['cat5','cat6'], experience: 7,  description: 'Expert painter and carpenter offering high-quality interior/exterior painting and woodwork.', skills: ['Interior Painting','Exterior Painting','Wood Finishing','Furniture Repair'], rating: 4.5, totalReviews: 63,  completedJobs: 147, hourlyRate: 55, verificationStatus: 'verified', availability: defaultAvailability, isAvailableToday: true,  isActive: true },
];

// ─── Seed reviews ────────────────────────────────────────────
const reviews = [
  { _id: 'r1', customerId: 'u2', professionalId: 'p1', bookingId: 'bk_seed1', serviceId: 's1', rating: 5, comment: 'Michael arrived on time and fixed the leak perfectly. Highly recommend!', isVisible: true, createdAt: new Date('2024-02-01') },
  { _id: 'r2', customerId: 'u3', professionalId: 'p2', bookingId: 'bk_seed2', serviceId: 's3', rating: 5, comment: 'Robert is extremely knowledgeable. Panel upgrade done safely and efficiently.', isVisible: true, createdAt: new Date('2024-02-05') },
  { _id: 'r3', customerId: 'u2', professionalId: 'p3', bookingId: 'bk_seed3', serviceId: 's5', rating: 4, comment: 'Sarah did an amazing deep clean. The house looks spotless!', isVisible: true, createdAt: new Date('2024-02-10') },
];

// ─── Live bookings (empty at start) ─────────────────────────
const bookings = [];

// ─── Exported store ──────────────────────────────────────────
const store = {
  categories,
  services,
  users,
  professionals,
  reviews,
  bookings,
  newId,
  bookingId,
};

module.exports = store;
