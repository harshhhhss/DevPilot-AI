const Organization = require('../models/Organization');
const User = require('../models/User');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Admin-only: view all organizations with basic usage stats.
const listOrganizations = asyncHandler(async (req, res) => {
  const orgs = await Organization.find().sort({ name: 1 }).lean();

  const data = await Promise.all(
    orgs.map(async (org) => {
      const [memberCount, projectCount] = await Promise.all([
        User.countDocuments({ organization: org._id }),
        Project.countDocuments({ organization: org._id }),
      ]);
      return { ...org, memberCount, projectCount };
    })
  );

  res.status(200).json({ success: true, data });
});

const getOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw new ApiError(404, 'Organization not found');

  res.status(200).json({ success: true, data: org });
});

module.exports = { listOrganizations, getOrganization };
