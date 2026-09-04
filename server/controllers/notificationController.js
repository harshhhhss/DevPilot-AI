const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const listNotifications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;

  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

  res.status(200).json({ success: true, data: notifications, unreadCount });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, 'Notification not found');

  notification.read = true;
  await notification.save();

  res.status(200).json({ success: true, data: notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });

  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, 'Notification not found');

  res.status(200).json({ success: true, message: 'Notification deleted' });
});

module.exports = { listNotifications, markAsRead, markAllAsRead, deleteNotification };
