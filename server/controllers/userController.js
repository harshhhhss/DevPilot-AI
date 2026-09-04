const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/roles');

// GET /api/v1/users — team directory, scoped to the caller's organization.
const listUsers = asyncHandler(async (req, res) => {
  const filter = { organization: req.user.organization };

  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
    ];
  }

  const users = await User.find(filter).select('-password').sort({ name: 1 });

  res.status(200).json({ success: true, data: users });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) throw new ApiError(404, 'User not found');

  res.status(200).json({ success: true, data: user });
});

// PUT /api/v1/users/:id/role — Admin only.
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!Object.values(ROLES).includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot change your own role — ask another admin to do it');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.role = role;
  await user.save();

  res.status(200).json({ success: true, data: user });
});

// PUT /api/v1/users/:id/status — Admin only, activate/deactivate an account.
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.isActive = Boolean(isActive);
  await user.save();

  res.status(200).json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  await user.deleteOne();

  res.status(200).json({ success: true, message: 'User removed' });
});

module.exports = {
  listUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};
