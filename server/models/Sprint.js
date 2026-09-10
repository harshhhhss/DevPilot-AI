const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    goal: {
      type: String,
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'COMPLETED'],
      default: 'PLANNED',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The human-approved retrospective. AI drafts one (wentWell/didntGoWell/
    // improvements) but nothing here is written until the Manager reviews the
    // draft and explicitly saves it (CON-08) — see sprintController.saveRetrospective.
    retrospective: {
      wentWell: { type: [String], default: [] },
      didntGoWell: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      savedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

sprintSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('Sprint', sprintSchema);
