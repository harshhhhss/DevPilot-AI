const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/roles');

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  organization: user.organization,
  avatar: user.avatar,
  token: generateToken(user._id, user.role),
});

// Finds an organization by (case-insensitive) name, creating it if it
// doesn't exist yet. Keeps registration a single step for demo/academic use
// while still giving Admins a real Organization collection to manage.
const findOrCreateOrganization = async (name, ownerId) => {
  const trimmed = (name || 'Default Org').trim();
  let org = await Organization.findOne({ name: new RegExp(`^${trimmed}$`, 'i') });

  if (!org) {
    org = await Organization.create({ name: trimmed, owner: ownerId });
  }

  return org;
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, organization } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Please provide name, email, and password');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });

  if (userExists) {
    throw new ApiError(400, 'User already exists');
  }

  const allowedRole = Object.values(ROLES).includes(role) ? role : ROLES.DEVELOPER;

  // A user cannot self-register as Admin; the first Admin comes from the
  // seed script, and further Admins are provisioned by an existing Admin.
  const safeRole = allowedRole === ROLES.ADMIN ? ROLES.DEVELOPER : allowedRole;

  const user = new User({ name, email, password, role: safeRole });
  const org = await findOrCreateOrganization(organization, user._id);
  user.organization = org._id;
  await user.save();
  await user.populate('organization', 'name');

  res.status(201).json({
    success: true,
    data: buildAuthResponse(user),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).populate('organization', 'name');

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated. Contact your administrator.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    data: buildAuthResponse(user),
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('organization', 'name');

  res.status(200).json({
    success: true,
    data: user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  await user.populate('organization', 'name');

  res.status(200).json({ success: true, data: user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Please provide current and new password');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id);

  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
};
