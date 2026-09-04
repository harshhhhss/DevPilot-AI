const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['Task', 'Bug'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

commentSchema.index({ entityType: 1, entityId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
