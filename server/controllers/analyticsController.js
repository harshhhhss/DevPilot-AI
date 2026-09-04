const Project = require('../models/Project');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Sprint = require('../models/Sprint');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { canViewProject, isAdmin } = require('../utils/accessControl');

// GET /api/v1/analytics/overview — organization-wide summary for the main dashboard.
const getOverview = asyncHandler(async (req, res) => {
  const projectFilter = isAdmin(req.user)
    ? { organization: req.user.organization }
    : { organization: req.user.organization, $or: [{ manager: req.user._id }, { members: req.user._id }] };

  const projects = await Project.find(projectFilter).select('_id status riskLevel');
  const projectIds = projects.map((p) => p._id);

  const [totalTasks, completedTasks, pendingTasks, openBugs, criticalBugs] = await Promise.all([
    Task.countDocuments({ project: { $in: projectIds } }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'DONE' }),
    Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'DONE' } }),
    Bug.countDocuments({ project: { $in: projectIds }, status: { $in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] } }),
    Bug.countDocuments({ project: { $in: projectIds }, severity: 'CRITICAL', status: { $ne: 'CLOSED' } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === 'ACTIVE').length,
      completedProjects: projects.filter((p) => p.status === 'COMPLETED').length,
      totalTasks,
      completedTasks,
      pendingTasks,
      openBugs,
      criticalBugs,
      highRiskProjects: projects.filter((p) => p.riskLevel === 'HIGH').length,
    },
  });
});

// GET /api/v1/projects/:projectId/analytics — project-level dashboard.
// SRS 5.2: analytics/risk viewing is allowed for every role (including Viewer).
const getProjectAnalytics = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId).populate('members', 'name role');
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const [tasks, bugs, sprints] = await Promise.all([
    Task.find({ project: project._id }).select('status priority assignee dueDate sprint'),
    Bug.find({ project: project._id }).select('status severity createdAt'),
    Sprint.find({ project: project._id }).select('name status startDate endDate'),
  ]);

  const taskStatusBreakdown = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }));

  const bugSeverityBreakdown = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((severity) => ({
    severity,
    count: bugs.filter((b) => b.severity === severity && b.status !== 'CLOSED').length,
  }));

  const now = new Date();
  const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length;

  const workloadMap = new Map();
  tasks.forEach((t) => {
    if (!t.assignee) return;
    const key = String(t.assignee);
    workloadMap.set(key, (workloadMap.get(key) || 0) + 1);
  });

  const teamWorkload = await Promise.all(
    [...workloadMap.entries()].map(async ([userId, count]) => {
      const user = await User.findById(userId).select('name avatar role');
      return { user, taskCount: count };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      progress: project.progress,
      taskStatusBreakdown,
      bugSeverityBreakdown,
      overdueTasks,
      openBugs: bugs.filter((b) => b.status !== 'CLOSED' && b.status !== 'RESOLVED').length,
      criticalBugs: bugs.filter((b) => b.severity === 'CRITICAL' && b.status !== 'CLOSED').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'DONE').length,
      sprints,
      teamWorkload,
      risk: {
        level: project.riskLevel,
        explanation: project.riskExplanation,
        updatedAt: project.riskUpdatedAt,
      },
    },
  });
});

module.exports = { getOverview, getProjectAnalytics };
