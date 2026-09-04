const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
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
    acceptanceCriteria: {
      type: [String],
      default: [],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    aiSuggestedPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', null],
      default: null,
    },
    aiPriorityReason: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      default: 'TODO',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    storyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // True when this task originated from an AI Sprint Planner / User Story
    // generation and was committed after human review (SRS CON-08).
    aiGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ sprint: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
