const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
      default: 'PLANNING',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: null,
    },
    riskExplanation: {
      type: String,
      default: '',
    },
    riskUpdatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

projectSchema.index({ organization: 1, status: 1 });
projectSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Project', projectSchema);
