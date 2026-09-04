const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    keyDecisions: {
      type: [String],
      default: [],
    },
    actionItems: [
      {
        description: { type: String, required: true },
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        assigneeName: { type: String, default: '' },
        // Free text, not a Date: deadlines extracted from meeting notes are
        // often relative/fuzzy ("Friday", "end of sprint") and can't always
        // be resolved to a precise calendar date.
        deadline: { type: String, default: '' },
        convertedToTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
      },
    ],
    discussionPoints: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meeting', meetingSchema);
