const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { isAdmin, canViewProject, canManageProject } = require('../utils/accessControl');
const { notifyMany } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');

const POPULATE_FIELDS = [
  { path: 'manager', select: 'name email avatar role' },
  { path: 'members', select: 'name email avatar role' },
];

const recomputeProgress = async (projectId) => {
  const tasks = await Task.find({ project: projectId }).select('status');
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const progress = Math.round((done / tasks.length) * 100);
  await Project.findByIdAndUpdate(projectId, { progress });
  return progress;
};

// GET /api/v1/projects
const listProjects = asyncHandler(async (req, res) => {
  const filter = isAdmin(req.user)
    ? { organization: req.user.organization }
    : {
        organization: req.user.organization,
        $or: [{ manager: req.user._id }, { members: req.user._id }],
      };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const projects = await Project.find(filter).populate(POPULATE_FIELDS).sort({ updatedAt: -1 });

  res.status(200).json({ success: true, data: projects });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!project) throw new ApiError(404, 'Project not found');

  if (!canViewProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: you are not a member of this project');
  }

  res.status(200).json({ success: true, data: project });
});

// POST /api/v1/projects — Project Manager / Admin only.
const createProject = asyncHandler(async (req, res) => {
  const { name, description, startDate, endDate, members } = req.body;

  if (!name) throw new ApiError(400, 'Project name is required');

  const project = await Project.create({
    name,
    description,
    organization: req.user.organization,
    manager: req.user._id,
    members: members || [],
    startDate,
    endDate,
  });

  await project.populate(POPULATE_FIELDS);
  await logActivity({
    projectId: project._id,
    userId: req.user._id,
    action: 'PROJECT_CREATED',
    entityType: 'Project',
    entityId: project._id,
  });

  res.status(201).json({ success: true, data: project });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (!canManageProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the project manager or an admin can edit this project');
  }

  const { name, description, status, startDate, endDate } = req.body;

  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (status !== undefined) project.status = status;
  if (startDate !== undefined) project.startDate = startDate;
  if (endDate !== undefined) project.endDate = endDate;

  await project.save();
  await project.populate(POPULATE_FIELDS);

  await logActivity({
    projectId: project._id,
    userId: req.user._id,
    action: 'PROJECT_UPDATED',
    entityType: 'Project',
    entityId: project._id,
  });

  res.status(200).json({ success: true, data: project });
});

const archiveProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (!canManageProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the project manager or an admin can archive this project');
  }

  project.status = 'ARCHIVED';
  await project.save();

  res.status(200).json({ success: true, data: project });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (!canManageProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the project manager or an admin can delete this project');
  }

  await project.deleteOne();

  res.status(200).json({ success: true, message: 'Project deleted' });
});

const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (!canManageProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the project manager or an admin can add members');
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (!project.members.map(String).includes(String(userId))) {
    project.members.push(userId);
    await project.save();
  }

  await project.populate(POPULATE_FIELDS);

  await notifyMany({
    userIds: [userId],
    actingUserId: req.user._id,
    type: 'PROJECT_MEMBER_ADDED',
    message: `You were added to project "${project.name}"`,
    relatedEntity: { entityType: 'Project', entityId: project._id },
  });

  res.status(200).json({ success: true, data: project });
});

const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (!canManageProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the project manager or an admin can remove members');
  }

  project.members = project.members.filter((m) => String(m) !== String(req.params.userId));
  await project.save();
  await project.populate(POPULATE_FIELDS);

  res.status(200).json({ success: true, data: project });
});

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
  addMember,
  removeMember,
  recomputeProgress,
};
