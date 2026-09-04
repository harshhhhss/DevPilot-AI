const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { canViewProject, canManageProject, isAdmin } = require('../utils/accessControl');
const { notify } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');
const { emitToProject } = require('../socket');
const { recomputeProgress } = require('./projectController');

const POPULATE_FIELDS = [
  { path: 'assignee', select: 'name email avatar role' },
  { path: 'createdBy', select: 'name email avatar role' },
  { path: 'dependencies', select: 'title status' },
];

const loadProject = async (projectId) => {
  const project = await Project.findById(projectId).populate('members', 'name');
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

// Route can be mounted either nested under a project (/projects/:projectId/tasks)
// or flat (/tasks) for a user's cross-project task list.
const listTasks = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.params.projectId) {
    const project = await loadProject(req.params.projectId);
    if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');
    filter.project = project._id;
  } else if (!isAdmin(req.user)) {
    filter.assignee = req.user._id;
  }

  if (req.query.sprint) filter.sprint = req.query.sprint;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignee) filter.assignee = req.query.assignee;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const tasks = await Task.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: tasks });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!task) throw new ApiError(404, 'Task not found');

  const project = await loadProject(task.project);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  res.status(200).json({ success: true, data: task });
});

// Creation is used both for manual task entry and for committing
// reviewed/edited AI Sprint Planner output (CON-08: never auto-persisted).
const createTask = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId || req.body.project;
  const project = await loadProject(projectId);

  if (!canManageProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the project manager or an admin can create tasks');
  }

  const {
    title,
    description,
    acceptanceCriteria,
    sprint,
    assignee,
    priority,
    dueDate,
    storyPoints,
    dependencies,
    aiGenerated,
  } = req.body;

  if (!title) throw new ApiError(400, 'Task title is required');

  const task = await Task.create({
    title,
    description,
    acceptanceCriteria,
    project: project._id,
    sprint: sprint || null,
    assignee: assignee || null,
    priority,
    dueDate,
    storyPoints,
    dependencies,
    createdBy: req.user._id,
    aiGenerated: Boolean(aiGenerated),
  });

  await task.populate(POPULATE_FIELDS);
  await recomputeProgress(project._id);
  emitToProject(String(project._id), 'task:created', task);

  if (assignee) {
    await notify({
      userId: assignee,
      type: 'TASK_ASSIGNED',
      message: `You were assigned task "${task.title}"`,
      relatedEntity: { entityType: 'Task', entityId: task._id },
    });
  }

  await logActivity({
    projectId: project._id,
    userId: req.user._id,
    action: 'TASK_CREATED',
    entityType: 'Task',
    entityId: task._id,
  });

  res.status(201).json({ success: true, data: task });
});

const canEditTaskDetails = (project, user) => canManageProject(project, user);

const canChangeStatus = (task, project, user) =>
  canManageProject(project, user) || String(task.assignee) === String(user._id);

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  const project = await loadProject(task.project);
  const {
    title,
    description,
    acceptanceCriteria,
    sprint,
    assignee,
    priority,
    status,
    dueDate,
    storyPoints,
    dependencies,
  } = req.body;

  const isStatusOnlyChange =
    status !== undefined &&
    [title, description, acceptanceCriteria, sprint, assignee, priority, dueDate, storyPoints, dependencies].every(
      (v) => v === undefined
    );

  if (isStatusOnlyChange) {
    if (!canChangeStatus(task, project, req.user)) {
      throw new ApiError(403, 'Forbidden: only the assignee, project manager, or admin can update status');
    }
  } else if (!canEditTaskDetails(project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the project manager or an admin can edit task details');
  }

  const previousAssignee = task.assignee ? String(task.assignee) : null;
  const previousStatus = task.status;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (acceptanceCriteria !== undefined) task.acceptanceCriteria = acceptanceCriteria;
  if (sprint !== undefined) task.sprint = sprint || null;
  if (assignee !== undefined) task.assignee = assignee || null;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (storyPoints !== undefined) task.storyPoints = storyPoints;
  if (dependencies !== undefined) task.dependencies = dependencies;

  await task.save();
  await task.populate(POPULATE_FIELDS);
  await recomputeProgress(project._id);

  emitToProject(String(project._id), 'task:updated', task);

  if (assignee !== undefined && String(assignee) !== previousAssignee && assignee) {
    await notify({
      userId: assignee,
      type: 'TASK_ASSIGNED',
      message: `You were assigned task "${task.title}"`,
      relatedEntity: { entityType: 'Task', entityId: task._id },
    });
  } else if (status !== undefined && status !== previousStatus && task.assignee) {
    await notify({
      userId: task.assignee,
      type: 'TASK_UPDATED',
      message: `Task "${task.title}" moved to ${status.replace('_', ' ')}`,
      relatedEntity: { entityType: 'Task', entityId: task._id },
    });
  }

  await logActivity({
    projectId: project._id,
    userId: req.user._id,
    action: 'TASK_UPDATED',
    entityType: 'Task',
    entityId: task._id,
    meta: { status: task.status },
  });

  res.status(200).json({ success: true, data: task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  const project = await loadProject(task.project);
  if (!canManageProject(project, req.user)) {
    throw new ApiError(403, 'Forbidden: only the project manager or an admin can delete tasks');
  }

  await task.deleteOne();
  await recomputeProgress(project._id);
  emitToProject(String(project._id), 'task:deleted', { _id: task._id });

  res.status(200).json({ success: true, message: 'Task deleted' });
});

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
