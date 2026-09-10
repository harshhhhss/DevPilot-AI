const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { canViewProject, canManageProject } = require('../utils/accessControl');
const { logActivity } = require('../services/activityService');

const loadProject = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

const listSprints = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const sprints = await Sprint.find({ project: project._id }).sort({ startDate: 1 });

  res.status(200).json({ success: true, data: sprints });
});

const getSprint = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const sprint = await Sprint.findOne({ _id: req.params.id, project: project._id });
  if (!sprint) throw new ApiError(404, 'Sprint not found');

  const tasks = await Task.find({ sprint: sprint._id }).populate('assignee', 'name avatar');
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const sprintProgress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  res.status(200).json({ success: true, data: { ...sprint.toObject(), tasks, progress: sprintProgress } });
});

const createSprint = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden: only the project manager or an admin can create sprints');

  const { name, goal, startDate, endDate } = req.body;
  if (!name || !startDate || !endDate) throw new ApiError(400, 'name, startDate and endDate are required');

  const sprint = await Sprint.create({
    name,
    goal,
    startDate,
    endDate,
    project: project._id,
    createdBy: req.user._id,
  });

  await logActivity({
    projectId: project._id,
    userId: req.user._id,
    action: 'SPRINT_CREATED',
    entityType: 'Sprint',
    entityId: sprint._id,
    meta: { name: sprint.name },
  });

  res.status(201).json({ success: true, data: sprint });
});

const updateSprint = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden: only the project manager or an admin can edit sprints');

  const sprint = await Sprint.findOne({ _id: req.params.id, project: project._id });
  if (!sprint) throw new ApiError(404, 'Sprint not found');

  const { name, goal, status, startDate, endDate } = req.body;
  if (name !== undefined) sprint.name = name;
  if (goal !== undefined) sprint.goal = goal;
  if (status !== undefined) sprint.status = status;
  if (startDate !== undefined) sprint.startDate = startDate;
  if (endDate !== undefined) sprint.endDate = endDate;

  await sprint.save();

  if (status !== undefined) {
    await logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: 'SPRINT_STATUS_CHANGED',
      entityType: 'Sprint',
      entityId: sprint._id,
      meta: { status: sprint.status },
    });
  }

  res.status(200).json({ success: true, data: sprint });
});

// PUT /api/v1/projects/:projectId/sprints/:id/retrospective — Manager/Admin
// only. Persists the human-reviewed retrospective (CON-08: the AI draft from
// POST /ai/sprint-retro is never saved automatically — this is the explicit
// confirm step).
const saveSprintRetrospective = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden: only the project manager or an admin can save a sprint retrospective');

  const sprint = await Sprint.findOne({ _id: req.params.id, project: project._id });
  if (!sprint) throw new ApiError(404, 'Sprint not found');

  const { wentWell, didntGoWell, improvements } = req.body;

  sprint.retrospective = {
    wentWell: wentWell || [],
    didntGoWell: didntGoWell || [],
    improvements: improvements || [],
    savedBy: req.user._id,
    savedAt: new Date(),
  };

  await sprint.save();

  res.status(200).json({ success: true, data: sprint });
});

const deleteSprint = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden: only the project manager or an admin can delete sprints');

  const sprint = await Sprint.findOne({ _id: req.params.id, project: project._id });
  if (!sprint) throw new ApiError(404, 'Sprint not found');

  await Task.updateMany({ sprint: sprint._id }, { $set: { sprint: null } });
  await sprint.deleteOne();

  res.status(200).json({ success: true, message: 'Sprint deleted' });
});

module.exports = { listSprints, getSprint, createSprint, updateSprint, deleteSprint, saveSprintRetrospective };
