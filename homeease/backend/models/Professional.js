const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  startTime: { type: String, default: '09:00' },
  endTime: { type: String, default: '18:00' },
  isAvailable: { type: Boolean, default: true },
});

const professionalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    serviceCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    experience: {
      type: Number, // in years
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    skills: [{ type: String }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    availability: [availabilitySlotSchema],
    isAvailableToday: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    location: {
      city: String,
      state: String,
      serviceRadius: { type: Number, default: 20 }, // km
    },
    documents: [{ type: String }], // for verification docs
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

professionalSchema.index({ userId: 1 });
professionalSchema.index({ serviceCategories: 1 });
professionalSchema.index({ rating: -1 });
professionalSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('Professional', professionalSchema);
