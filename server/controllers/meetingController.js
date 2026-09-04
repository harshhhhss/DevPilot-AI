const Meeting = require('../models/Meeting');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { canViewProject } = require('../utils/accessControl');
const { recomputeProgress } = require('./projectController');

const loadProject = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

// The AI summarizer only knows attendees by name (assigneeName), not their
// user id, so match each action item against the project's real members —
// otherwise every action item converted to a task would come out unassigned
// even when the meeting notes named a specific person.
const resolveActionItemAssignees = async (actionItems, project) => {
  if (!actionItems?.length) return actionItems;

  const memberIds = [project.manager, ...(project.members || [])].filter(Boolean);
  const members = await User.find({ _id: { $in: memberIds } }).select('name');

  return actionItems.map((item) => {
    if (item.assignee || !item.assigneeName) return item;

    const needle = item.assigneeName.trim().toLowerCase();
    const match = members.find((m) => {
      const name = m.name.toLowerCase();
      return name.includes(needle) || needle.includes(name.split(' ')[0]);
    });

    return match ? { ...item, assignee: match._id, assigneeName: match.name } : item;
  });
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

  const resolvedActionItems = await resolveActionItemAssignees(actionItems, project);

  const meeting = await Meeting.create({
    project: project._id,
    title,
    notes,
    summary,
    keyDecisions,
    actionItems: resolvedActionItems,
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

  // item.deadline is free text ("Friday", "end of sprint") and often isn't a
  // real calendar date, but Task.dueDate is a Date field — only carry it over
  // when it actually parses, otherwise leave the due date for the user to set.
  const parsedDeadline = item.deadline ? new Date(item.deadline) : null;
  const dueDate = parsedDeadline && !Number.isNaN(parsedDeadline.getTime()) ? parsedDeadline : null;

  const task = await Task.create({
    title: item.description,
    project: project._id,
    assignee: item.assignee || null,
    dueDate,
    createdBy: req.user._id,
    aiGenerated: true,
  });

  item.convertedToTask = task._id;
  await meeting.save();
  await recomputeProgress(project._id);

  res.status(201).json({ success: true, data: task });
});

module.exports = { listMeetings, getMeeting, createMeeting, convertActionItem };
