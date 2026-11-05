const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

categorySchema.index({ categoryName: 1 });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
