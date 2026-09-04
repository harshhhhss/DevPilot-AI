const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { canViewProject } = require('../utils/accessControl');

// GET /api/v1/projects/:projectId/activity — recent activity feed for a project.
const listProjectActivity = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const limit = Math.min(Number(req.query.limit) || 30, 100);

  const activity = await ActivityLog.find({ project: project._id })
    .populate('user', 'name avatar role')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json({ success: true, data: activity });
});

module.exports = { listProjectActivity };
