const Bug = require('../models/Bug');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { canViewProject, canManageProject, isAdmin } = require('../utils/accessControl');
const { notify } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');
const { emitToProject } = require('../socket');

const POPULATE_FIELDS = [
  { path: 'reporter', select: 'name email avatar role' },
  { path: 'assignedDeveloper', select: 'name email avatar role' },
  { path: 'relatedTask', select: 'title status' },
];

const loadProject = async (projectId) => {
  const project = await Project.findById(projectId).populate('members', 'name');
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

const listBugs = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.params.projectId) {
    const project = await loadProject(req.params.projectId);
    if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');
    filter.project = project._id;
  } else if (!isAdmin(req.user)) {
    filter.$or = [{ reporter: req.user._id }, { assignedDeveloper: req.user._id }];
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const bugs = await Bug.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: bugs });
});

const getBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!bug) throw new ApiError(404, 'Bug not found');

  const project = await loadProject(bug.project);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  res.status(200).json({ success: true, data: bug });
});

// Any project member may report a bug — Testers primarily, but SRS 5.2
// grants "log/assign/resolve" to Manager and Dev/Tester alike.
const createBug = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId || req.body.project;
  const project = await loadProject(projectId);

  if (!canViewProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: you are not a member of this project');
  }

  const {
    title,
    description,
    relatedTask,
    severity,
    priority,
    stepsToReproduce,
    expectedResult,
    actualResult,
    assignedDeveloper,
    attachments,
  } = req.body;

  if (!title) throw new ApiError(400, 'Bug title is required');

  const bug = await Bug.create({
    title,
    description,
    project: project._id,
    relatedTask: relatedTask || null,
    severity,
    priority,
    stepsToReproduce,
    expectedResult,
    actualResult,
    attachments,
    reporter: req.user._id,
    assignedDeveloper: assignedDeveloper || null,
  });

  await bug.populate(POPULATE_FIELDS);
  emitToProject(String(project._id), 'bug:created', bug);

  if (assignedDeveloper) {
    await notify({
      userId: assignedDeveloper,
      type: 'BUG_ASSIGNED',
      message: `You were assigned bug "${bug.title}"`,
      relatedEntity: { entityType: 'Bug', entityId: bug._id },
    });
  }

  await logActivity({
    projectId: project._id,
    userId: req.user._id,
    action: 'BUG_REPORTED',
    entityType: 'Bug',
    entityId: bug._id,
  });

  res.status(201).json({ success: true, data: bug });
});

const canUpdateBug = (bug, project, user) =>
  canManageProject(project, user) ||
  String(bug.reporter) === String(user._id) ||
  String(bug.assignedDeveloper) === String(user._id);

const updateBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findById(req.params.id);
  if (!bug) throw new ApiError(404, 'Bug not found');

  const project = await loadProject(bug.project);
  if (!canUpdateBug(bug, project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the reporter, assignee, project manager, or admin can update this bug');
  }

  const {
    title,
    description,
    severity,
    priority,
    status,
    stepsToReproduce,
    expectedResult,
    actualResult,
    assignedDeveloper,
    relatedTask,
    attachments,
  } = req.body;

  const previousAssignee = bug.assignedDeveloper ? String(bug.assignedDeveloper) : null;

  if (title !== undefined) bug.title = title;
  if (description !== undefined) bug.description = description;
  if (severity !== undefined) bug.severity = severity;
  if (priority !== undefined) bug.priority = priority;
  if (status !== undefined) bug.status = status;
  if (stepsToReproduce !== undefined) bug.stepsToReproduce = stepsToReproduce;
  if (expectedResult !== undefined) bug.expectedResult = expectedResult;
  if (actualResult !== undefined) bug.actualResult = actualResult;
  if (assignedDeveloper !== undefined) bug.assignedDeveloper = assignedDeveloper || null;
  if (relatedTask !== undefined) bug.relatedTask = relatedTask || null;
  if (attachments !== undefined) bug.attachments = attachments;

  await bug.save();
  await bug.populate(POPULATE_FIELDS);

  emitToProject(String(project._id), 'bug:updated', bug);

  if (assignedDeveloper !== undefined && String(assignedDeveloper) !== previousAssignee && assignedDeveloper) {
    await notify({
      userId: assignedDeveloper,
      type: 'BUG_ASSIGNED',
      message: `You were assigned bug "${bug.title}"`,
      relatedEntity: { entityType: 'Bug', entityId: bug._id },
    });
  } else if (status !== undefined) {
    const notifyTarget = bug.assignedDeveloper || bug.reporter;
    if (notifyTarget) {
      await notify({
        userId: notifyTarget,
        type: 'BUG_UPDATED',
        message: `Bug "${bug.title}" status changed to ${status}`,
        relatedEntity: { entityType: 'Bug', entityId: bug._id },
      });
    }
  }

  await logActivity({
    projectId: project._id,
    userId: req.user._id,
    action: 'BUG_UPDATED',
    entityType: 'Bug',
    entityId: bug._id,
    meta: { status: bug.status },
  });

  res.status(200).json({ success: true, data: bug });
});

const deleteBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findById(req.params.id);
  if (!bug) throw new ApiError(404, 'Bug not found');

  const project = await loadProject(bug.project);
  if (!canManageProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the project manager or an admin can delete bugs');
  }

  await bug.deleteOne();
  emitToProject(String(project._id), 'bug:deleted', { _id: bug._id });

  res.status(200).json({ success: true, message: 'Bug deleted' });
});

module.exports = { listBugs, getBug, createBug, updateBug, deleteBug };
