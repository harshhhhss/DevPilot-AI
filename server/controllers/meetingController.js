const Meeting = require('../models/Meeting');
const Project = require('../models/Project');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { canViewProject } = require('../utils/accessControl');
const { recomputeProgress } = require('./projectController');

const loadProject = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

const listMeetings = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const meetings = await Meeting.find({ project: project._id }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: meetings });
});

const getMeeting = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const meeting = await Meeting.findOne({ _id: req.params.id, project: project._id });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  res.status(200).json({ success: true, data: meeting });
});

// Persists a meeting AFTER the user has reviewed/edited the AI-generated
// summary — mirrors the same "advisory draft, human confirms" flow as the
// sprint planner (CON-08).
const createMeeting = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const { title, notes, summary, keyDecisions, actionItems, discussionPoints } = req.body;
  if (!title || !notes) throw new ApiError(400, 'title and notes are required');

  const meeting = await Meeting.create({
    project: project._id,
    title,
    notes,
    summary,
    keyDecisions,
    actionItems,
    discussionPoints,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: meeting });
});

// Converts one reviewed action item into a real Task.
const convertActionItem = asyncHandler(async (req, res) => {
  const project = await loadProject(req.params.projectId);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const meeting = await Meeting.findOne({ _id: req.params.id, project: project._id });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  const item = meeting.actionItems.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Action item not found');

  const task = await Task.create({
    title: item.description,
    project: project._id,
    assignee: item.assignee || null,
    dueDate: item.deadline || null,
    createdBy: req.user._id,
    aiGenerated: true,
  });

  item.convertedToTask = task._id;
  await meeting.save();
  await recomputeProgress(project._id);

  res.status(201).json({ success: true, data: task });
});

module.exports = { listMeetings, getMeeting, createMeeting, convertActionItem };
