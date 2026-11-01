const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    location: {
      type: String,
      trim: true,
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
    },
    salaryMin: {
      type: Number,
      min: 0,
    },
    salaryMax: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for search and filtering
jobSchema.index({ status: 1 });
jobSchema.index({ recruiter: 1 });
jobSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
