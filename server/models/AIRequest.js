const mongoose = require('mongoose');

const aiRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'SPRINT_PLAN',
        'USER_STORY',
        'TASK_PRIORITIZATION',
        'BUG_ANALYSIS',
        'RISK_ANALYSIS',
        'MEETING_SUMMARY',
        'TASK_PARSE',
        'SPRINT_RETRO',
      ],
      required: true,
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIRequest', aiRequestSchema);
