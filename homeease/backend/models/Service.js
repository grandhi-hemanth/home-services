const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    shortDescription: {
      type: String,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceType: {
      type: String,
      enum: ['fixed', 'hourly', 'starting_from'],
      default: 'starting_from',
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
    },
    image: {
      type: String,
      default: '',
    },
    features: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ avgRating: -1 });
serviceSchema.index({ serviceName: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
