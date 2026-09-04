const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'],
      default: 'OPEN',
    },
    stepsToReproduce: {
      type: String,
      default: '',
    },
    expectedResult: {
      type: String,
      default: '',
    },
    actualResult: {
      type: String,
      default: '',
    },
    attachments: [
      {
        url: String,
        name: String,
      },
    ],
    aiAnalysis: {
      possibleCause: { type: String, default: '' },
      suggestedSeverity: { type: String, default: '' },
      affectedModule: { type: String, default: '' },
      debuggingSuggestions: { type: [String], default: [] },
      nextSteps: { type: [String], default: [] },
      generatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

bugSchema.index({ project: 1, status: 1 });
bugSchema.index({ severity: 1 });
bugSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Bug', bugSchema);
