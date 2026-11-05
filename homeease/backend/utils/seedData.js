const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Professional = require('../models/Professional');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected for seeding');
};

const seedCategories = [
  { categoryName: 'Plumbing', description: 'Pipe repairs, installations, and water-related services', icon: 'Wrench', sortOrder: 1 },
  { categoryName: 'Electrical Services', description: 'Wiring, installations, and electrical repairs', icon: 'Zap', sortOrder: 2 },
  { categoryName: 'Home Cleaning', description: 'Deep cleaning, regular cleaning, and sanitization', icon: 'Sparkles', sortOrder: 3 },
  { categoryName: 'AC Repair', description: 'Air conditioner servicing, repair, and installation', icon: 'Wind', sortOrder: 4 },
  { categoryName: 'Painting', description: 'Interior and exterior painting services', icon: 'Paintbrush', sortOrder: 5 },
  { categoryName: 'Carpentry', description: 'Furniture assembly, wood repairs, and custom woodwork', icon: 'Hammer', sortOrder: 6 },
  { categoryName: 'Pest Control', description: 'Termite, rodent, and insect control services', icon: 'Bug', sortOrder: 7 },
  { categoryName: 'Appliance Repair', description: 'Washing machine, refrigerator, and appliance fixes', icon: 'Settings', sortOrder: 8 },
];

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Service.deleteMany({});
    await Professional.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create Categories
    const categories = await Category.insertMany(seedCategories);
    console.log(`✅ Created ${categories.length} categories`);

    const catMap = {};
    categories.forEach((c) => { catMap[c.categoryName] = c._id; });

    // Create Users
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const usersData = [
      { name: 'Admin User', email: 'admin@homeease.com', phone: '+1234567890', password: hashedPassword, role: 'admin' },
      { name: 'John Smith', email: 'john@homeease.com', phone: '+1234567891', password: hashedPassword, role: 'customer' },
      { name: 'Emily Davis', email: 'emily@homeease.com', phone: '+1234567892', password: hashedPassword, role: 'customer' },
      { name: 'Michael Johnson', email: 'michael@homeease.com', phone: '+1234567893', password: hashedPassword, role: 'professional' },
      { name: 'Robert Wilson', email: 'robert@homeease.com', phone: '+1234567894', password: hashedPassword, role: 'professional' },
      { name: 'Sarah Brown', email: 'sarah@homeease.com', phone: '+1234567895', password: hashedPassword, role: 'professional' },
      { name: 'David Martinez', email: 'david@homeease.com', phone: '+1234567896', password: hashedPassword, role: 'professional' },
      { name: 'Jennifer Taylor', email: 'jennifer@homeease.com', phone: '+1234567897', password: hashedPassword, role: 'professional' },
    ];

    // Use insertMany with pre-hashed passwords (skip pre-save hook)
    const users = await User.collection.insertMany(usersData.map(u => ({
      ...u,
      isActive: true,
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })));

    const userIds = Object.values(users.insertedIds);
    console.log(`✅ Created ${userIds.length} users`);

    // Create Professionals
    const defaultAvailability = [
      { day: 'Monday', startTime: '09:00', endTime: '18:00', isAvailable: true },
      { day: 'Tuesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
      { day: 'Wednesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
      { day: 'Thursday', startTime: '09:00', endTime: '18:00', isAvailable: true },
      { day: 'Friday', startTime: '09:00', endTime: '18:00', isAvailable: true },
      { day: 'Saturday', startTime: '09:00', endTime: '14:00', isAvailable: true },
      { day: 'Sunday', startTime: '00:00', endTime: '00:00', isAvailable: false },
    ];

    const professionalsData = [
      {
        userId: userIds[3],
        serviceCategories: [catMap['Plumbing']],
        experience: 8,
        description: 'Certified master plumber with 8 years of experience in residential and commercial plumbing.',
        skills: ['Pipe Installation', 'Leak Detection', 'Drain Cleaning', 'Water Heater Repair'],
        rating: 4.8,
        totalReviews: 124,
        completedJobs: 312,
        hourlyRate: 75,
        verificationStatus: 'verified',
        availability: defaultAvailability,
        isAvailableToday: true,
        location: { city: 'New York', state: 'NY', serviceRadius: 25 },
      },
      {
        userId: userIds[4],
        serviceCategories: [catMap['Electrical Services']],
        experience: 12,
        description: 'Licensed electrician specializing in residential wiring, panel upgrades, and smart home installations.',
        skills: ['Panel Upgrade', 'Wiring', 'Circuit Breaker', 'Smart Home', 'EV Charging'],
        rating: 4.9,
        totalReviews: 89,
        completedJobs: 245,
        hourlyRate: 90,
        verificationStatus: 'verified',
        availability: defaultAvailability,
        isAvailableToday: true,
        location: { city: 'New York', state: 'NY', serviceRadius: 30 },
      },
      {
        userId: userIds[5],
        serviceCategories: [catMap['Home Cleaning']],
        experience: 5,
        description: 'Professional home cleaning specialist with eco-friendly products and meticulous attention to detail.',
        skills: ['Deep Cleaning', 'Move-in/Move-out', 'Post-Construction', 'Regular Maintenance'],
        rating: 4.7,
        totalReviews: 156,
        completedJobs: 428,
        hourlyRate: 45,
        verificationStatus: 'verified',
        availability: defaultAvailability,
        isAvailableToday: true,
        location: { city: 'New York', state: 'NY', serviceRadius: 20 },
      },
      {
        userId: userIds[6],
        serviceCategories: [catMap['AC Repair'], catMap['Appliance Repair']],
        experience: 10,
        description: 'HVAC certified technician offering AC repair, servicing, and appliance repair services.',
        skills: ['AC Installation', 'Refrigerant Refill', 'Duct Cleaning', 'Appliance Diagnostics'],
        rating: 4.6,
        totalReviews: 78,
        completedJobs: 189,
        hourlyRate: 80,
        verificationStatus: 'verified',
        availability: defaultAvailability,
        isAvailableToday: false,
        location: { city: 'New York', state: 'NY', serviceRadius: 25 },
      },
      {
        userId: userIds[7],
        serviceCategories: [catMap['Painting'], catMap['Carpentry']],
        experience: 7,
        description: 'Expert painter and carpenter offering high-quality interior/exterior painting and woodwork.',
        skills: ['Interior Painting', 'Exterior Painting', 'Wood Finishing', 'Furniture Repair'],
        rating: 4.5,
        totalReviews: 63,
        completedJobs: 147,
        hourlyRate: 55,
        verificationStatus: 'verified',
        availability: defaultAvailability,
        isAvailableToday: true,
        location: { city: 'New York', state: 'NY', serviceRadius: 20 },
      },
    ];

    const professionals = await Professional.insertMany(professionalsData);
    console.log(`✅ Created ${professionals.length} professionals`);

    // Create Services
    const servicesData = [
      {
        serviceName: 'Emergency Plumbing Repair',
        category: catMap['Plumbing'],
        description: 'Fast and reliable emergency plumbing repairs for burst pipes, severe leaks, clogged drains, and other urgent plumbing issues. Available 24/7.',
        shortDescription: 'Fast emergency plumbing repairs for urgent issues',
        price: 99,
        priceType: 'starting_from',
        duration: 120,
        features: ['24/7 availability', 'Same-day service', 'All pipe types', 'Free inspection'],
        isActive: true,
        isFeatured: true,
        totalBookings: 245,
        avgRating: 4.7,
        totalReviews: 89,
      },
      {
        serviceName: 'Full Home Plumbing Inspection',
        category: catMap['Plumbing'],
        description: 'Comprehensive plumbing inspection covering all pipes, fixtures, water pressure, and drainage systems. Get a detailed report.',
        shortDescription: 'Complete inspection of your home plumbing system',
        price: 149,
        priceType: 'fixed',
        duration: 180,
        features: ['Complete pipe check', 'Water pressure test', 'Leak detection', 'Written report'],
        isActive: true,
        totalBookings: 120,
        avgRating: 4.8,
        totalReviews: 45,
      },
      {
        serviceName: 'Electrical Panel Upgrade',
        category: catMap['Electrical Services'],
        description: 'Safe and code-compliant electrical panel upgrades from 100A to 200A or higher. Includes permit assistance and final inspection.',
        shortDescription: 'Upgrade your electrical panel safely and legally',
        price: 299,
        priceType: 'starting_from',
        duration: 240,
        features: ['Code compliant', 'Permit assistance', 'Safety inspection', '1-year warranty'],
        isActive: true,
        isFeatured: true,
        totalBookings: 89,
        avgRating: 4.9,
        totalReviews: 34,
      },
      {
        serviceName: 'Home Wiring & Outlets',
        category: catMap['Electrical Services'],
        description: 'Professional installation of new electrical outlets, switches, ceiling fans, light fixtures, and home wiring services.',
        shortDescription: 'New outlets, switches, and electrical installations',
        price: 129,
        priceType: 'starting_from',
        duration: 120,
        features: ['GFCI outlets', 'USB outlets', 'Smart switches', 'Dimmer installation'],
        isActive: true,
        totalBookings: 178,
        avgRating: 4.6,
        totalReviews: 67,
      },
      {
        serviceName: 'Deep Home Cleaning',
        category: catMap['Home Cleaning'],
        description: 'Thorough deep cleaning of your entire home including kitchen, bathrooms, bedrooms, and living areas. Eco-friendly products used.',
        shortDescription: 'Complete top-to-bottom deep cleaning service',
        price: 199,
        priceType: 'starting_from',
        duration: 240,
        features: ['Eco-friendly products', 'All rooms covered', 'Appliance cleaning', 'Bathroom sanitization'],
        isActive: true,
        isFeatured: true,
        totalBookings: 432,
        avgRating: 4.8,
        totalReviews: 167,
      },
      {
        serviceName: 'Regular House Cleaning',
        category: catMap['Home Cleaning'],
        description: 'Weekly or bi-weekly house cleaning maintenance. Keep your home consistently clean with our professional cleaning team.',
        shortDescription: 'Regular scheduled cleaning for your home',
        price: 89,
        priceType: 'starting_from',
        duration: 120,
        features: ['Flexible scheduling', 'Same team', 'Supplies included', 'Customizable checklist'],
        isActive: true,
        totalBookings: 689,
        avgRating: 4.7,
        totalReviews: 234,
      },
      {
        serviceName: 'AC Service & Maintenance',
        category: catMap['AC Repair'],
        description: 'Complete AC servicing including filter cleaning, refrigerant check, coil cleaning, and performance optimization.',
        shortDescription: 'Full AC tune-up and maintenance service',
        price: 79,
        priceType: 'fixed',
        duration: 90,
        features: ['Filter cleaning', 'Refrigerant check', 'Coil cleaning', 'Performance report'],
        isActive: true,
        isFeatured: true,
        totalBookings: 356,
        avgRating: 4.6,
        totalReviews: 145,
      },
      {
        serviceName: 'AC Repair & Diagnostics',
        category: catMap['AC Repair'],
        description: 'Expert diagnosis and repair of all AC problems. We fix cooling issues, strange noises, water leaks, and electrical faults.',
        shortDescription: 'Diagnose and fix all AC problems efficiently',
        price: 119,
        priceType: 'starting_from',
        duration: 120,
        features: ['All brands', 'Same-day service', 'Warranty on parts', 'Free diagnostic'],
        isActive: true,
        totalBookings: 212,
        avgRating: 4.5,
        totalReviews: 89,
      },
      {
        serviceName: 'Interior House Painting',
        category: catMap['Painting'],
        description: 'Professional interior painting services for rooms, walls, ceilings, and trim. Premium paints, clean preparation, and perfect finish.',
        shortDescription: 'Professional interior painting for any room',
        price: 299,
        priceType: 'starting_from',
        duration: 480,
        features: ['Premium paints', 'Surface preparation', 'Color consultation', '2-year warranty'],
        isActive: true,
        isFeatured: true,
        totalBookings: 178,
        avgRating: 4.7,
        totalReviews: 56,
      },
      {
        serviceName: 'Exterior Painting',
        category: catMap['Painting'],
        description: 'High-quality exterior painting to protect and beautify your home. Weather-resistant paints and expert surface preparation.',
        shortDescription: 'Durable exterior painting for lasting beauty',
        price: 499,
        priceType: 'starting_from',
        duration: 960,
        features: ['Weather-resistant', 'Pressure washing', 'Caulking & prep', '3-year warranty'],
        isActive: true,
        totalBookings: 89,
        avgRating: 4.8,
        totalReviews: 34,
      },
      {
        serviceName: 'Furniture Assembly & Repair',
        category: catMap['Carpentry'],
        description: 'Expert furniture assembly for flat-pack furniture (IKEA and others) and repair of damaged furniture, cabinets, and woodwork.',
        shortDescription: 'Assembly and repair of all furniture types',
        price: 79,
        priceType: 'starting_from',
        duration: 120,
        features: ['All brands', 'Tools provided', 'Same-day', 'Clean-up included'],
        isActive: true,
        isFeatured: true,
        totalBookings: 456,
        avgRating: 4.6,
        totalReviews: 178,
      },
      {
        serviceName: 'General Pest Control',
        category: catMap['Pest Control'],
        description: 'Comprehensive pest control treatment for cockroaches, ants, bed bugs, rodents, and other pests. Safe for family and pets.',
        shortDescription: 'Effective pest elimination for your entire home',
        price: 149,
        priceType: 'starting_from',
        duration: 120,
        features: ['Pet-safe products', 'All pests covered', '90-day guarantee', 'Follow-up visit'],
        isActive: true,
        isFeatured: true,
        totalBookings: 267,
        avgRating: 4.5,
        totalReviews: 112,
      },
      {
        serviceName: 'Appliance Repair',
        category: catMap['Appliance Repair'],
        description: 'Professional repair for washing machines, dryers, refrigerators, dishwashers, ovens, and other home appliances.',
        shortDescription: 'Fix any home appliance quickly and affordably',
        price: 89,
        priceType: 'starting_from',
        duration: 90,
        features: ['All major brands', 'Genuine parts', '6-month warranty', 'Same-day service'],
        isActive: true,
        isFeatured: true,
        totalBookings: 389,
        avgRating: 4.6,
        totalReviews: 156,
      },
    ];

    const services = await Service.insertMany(servicesData);
    console.log(`✅ Created ${services.length} services`);

    console.log('\n🎉 Seed data created successfully!\n');
    console.log('📋 Test Credentials:');
    console.log('  Admin:    admin@homeease.com / password123');
    console.log('  Customer: john@homeease.com / password123');
    console.log('  Pro:      michael@homeease.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
