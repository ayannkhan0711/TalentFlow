const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    fromStage: {
      type: String,
    },
    toStage: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ application: 1, createdAt: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
