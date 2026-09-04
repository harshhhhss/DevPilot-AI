const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['Project', 'Sprint', 'Task', 'Bug', 'Comment', 'Meeting'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
