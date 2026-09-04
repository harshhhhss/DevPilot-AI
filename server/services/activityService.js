const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ projectId, userId, action, entityType, entityId, meta }) => {
  try {
    await ActivityLog.create({
      project: projectId,
      user: userId,
      action,
      entityType,
      entityId,
      meta: meta || {},
    });
  } catch (error) {
    // Activity logging must never break the primary request flow.
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = { logActivity };
