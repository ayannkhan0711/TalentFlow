const mongoose = require('mongoose');

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume is required'],
    },
    coverNote: {
      type: String,
      maxlength: [2000, 'Cover note cannot exceed 2000 characters'],
    },
    stage: {
      type: String,
      enum: STAGES,
      default: 'Applied',
    },
  },
  { timestamps: true }
);

// A candidate can apply to a job only once
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
module.exports.STAGES = STAGES;
