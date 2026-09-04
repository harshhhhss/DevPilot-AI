const Notification = require('../models/Notification');
const { emitToUser } = require('../socket');

/**
 * Creates a notification and pushes it in real time to the target user if
 * they have an active socket connection.
 */
const notify = async ({ userId, type, message, relatedEntity }) => {
  if (!userId) return null;

  const notification = await Notification.create({
    user: userId,
    type,
    message,
    relatedEntity: relatedEntity || undefined,
  });

  emitToUser(userId.toString(), 'notification:new', notification);

  return notification;
};

/**
 * Notifies every user in the list except the one performing the action.
 */
const notifyMany = async ({ userIds, actingUserId, type, message, relatedEntity }) => {
  const targets = [...new Set(userIds.map(String))].filter(
    (id) => id !== String(actingUserId || '')
  );

  return Promise.all(
    targets.map((userId) => notify({ userId, type, message, relatedEntity }))
  );
};

module.exports = { notify, notifyMany };
