const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'TASK_ASSIGNED',
        'TASK_UPDATED',
        'BUG_ASSIGNED',
        'BUG_UPDATED',
        'COMMENT_ADDED',
        'MENTION',
        'SPRINT_DEADLINE',
        'PROJECT_DEADLINE',
        'PROJECT_MEMBER_ADDED',
        'CHAT_MESSAGE',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['Project', 'Sprint', 'Task', 'Bug', 'Comment', null],
        default: null,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
