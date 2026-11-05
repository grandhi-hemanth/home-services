const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
    },
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
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String },
    },
    instructions: {
      type: String,
      maxlength: [500, 'Instructions cannot exceed 500 characters'],
    },
    servicePrice: {
      type: Number,
      required: true,
    },
    additionalCharges: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'professional_assigned',
        'in_progress',
        'completed',
        'cancelled',
      ],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['demo', 'cash', 'online'],
      default: 'demo',
    },
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'professional', 'admin'],
    },
    completedAt: {
      type: Date,
    },
    hasReview: {
      type: Boolean,
      default: false,
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: String,
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// Generate unique booking ID before saving
bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingId = `HE-${timestamp}-${random}`;
  }
  next();
});

bookingSchema.index({ customerId: 1 });
bookingSchema.index({ professionalId: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ appointmentDate: 1 });
bookingSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
