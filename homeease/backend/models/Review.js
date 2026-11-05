const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // one review per booking
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// After saving a review, update professional's average rating
reviewSchema.post('save', async function () {
  const Professional = require('./Professional');
  const reviews = await this.constructor.find({ professionalId: this.professionalId });
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  await Professional.findByIdAndUpdate(this.professionalId, {
    rating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
  });
});

reviewSchema.index({ professionalId: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
