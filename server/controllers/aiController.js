const Project = require('../models/Project');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Sprint = require('../models/Sprint');
const AIRequest = require('../models/AIRequest');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const aiService = require('../services/aiService');
const { canViewProject, canManageProject } = require('../utils/accessControl');

// Wraps every AI service call with audit logging (AIRequest) and consistent
// error surfacing, so a provider outage or malformed response degrades to a
// clear 5xx the frontend can catch and fall back to manual entry (CON-04) —
// never a silently faked result.
const runAI = async ({ user, project, type, input, fn }) => {
  const startedAt = Date.now();

  try {
    const output = await fn();
    await AIRequest.create({
      user: user._id,
      project: project?._id || null,
      type,
      input,
      output,
      status: 'SUCCESS',
      durationMs: Date.now() - startedAt,
    });
    return output;
  } catch (error) {
    await AIRequest.create({
      user: user._id,
      project: project?._id || null,
      type,
      input,
      status: 'FAILED',
      errorMessage: error.message,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
};

// POST /api/v1/ai/sprint-plan — Manager/Admin only (SRS 5.2: "Invoke AI planning").
const generateSprintPlan = asyncHandler(async (req, res) => {
  const { projectId, sprintGoal, teamSize } = req.body;
  if (!sprintGoal?.trim()) throw new ApiError(400, 'sprintGoal is required');

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden: only the project manager or an admin can invoke AI sprint planning');

  const output = await runAI({
    user: req.user,
    project,
    type: 'SPRINT_PLAN',
    input: { sprintGoal, teamSize },
    fn: () =>
      aiService.generateSprintPlan({
        sprintGoal,
        projectName: project.name,
        projectDescription: project.description,
        teamSize,
      }),
  });

  res.status(200).json({ success: true, data: output, disclaimer: 'AI-generated draft. Review and edit before saving.' });
});

// POST /api/v1/ai/user-story — Manager/Admin only.
const generateUserStory = asyncHandler(async (req, res) => {
  const { projectId, featureDescription } = req.body;
  if (!featureDescription?.trim()) throw new ApiError(400, 'featureDescription is required');

  let project = null;
  if (projectId) {
    project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, 'Project not found');
    if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden');
  }

  const output = await runAI({
    user: req.user,
    project,
    type: 'USER_STORY',
    input: { featureDescription },
    fn: () => aiService.generateUserStory({ featureDescription, projectName: project?.name }),
  });

  res.status(200).json({ success: true, data: output, disclaimer: 'AI-generated draft. Review and edit before saving.' });
});

// POST /api/v1/ai/prioritize-task — Manager/Admin only.
const prioritizeTask = asyncHandler(async (req, res) => {
  const { taskId } = req.body;
  const task = await Task.findById(taskId).populate('dependencies', 'status').populate('sprint', 'endDate');
  if (!task) throw new ApiError(404, 'Task not found');

  const project = await Project.findById(task.project);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const openDependencies = (task.dependencies || []).filter((d) => d.status !== 'DONE').length;

  const output = await runAI({
    user: req.user,
    project,
    type: 'TASK_PRIORITIZATION',
    input: { taskId },
    fn: () =>
      aiService.prioritizeTask({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        dependenciesCount: openDependencies,
        sprintEndDate: task.sprint?.endDate,
        currentPriority: task.priority,
      }),
  });

  task.aiSuggestedPriority = output.suggestedPriority;
  task.aiPriorityReason = output.reason;
  await task.save();

  res.status(200).json({ success: true, data: output, disclaimer: 'AI recommendation. Apply it only if you agree.' });
});

// POST /api/v1/ai/analyze-bug — any project member (part of triage/resolution work).
const analyzeBug = asyncHandler(async (req, res) => {
  const { bugId } = req.body;
  const bug = await Bug.findById(bugId);
  if (!bug) throw new ApiError(404, 'Bug not found');

  const project = await Project.findById(bug.project);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const output = await runAI({
    user: req.user,
    project,
    type: 'BUG_ANALYSIS',
    input: { bugId },
    fn: () =>
      aiService.analyzeBug({
        title: bug.title,
        description: bug.description,
        stepsToReproduce: bug.stepsToReproduce,
        expectedResult: bug.expectedResult,
        actualResult: bug.actualResult,
      }),
  });

  bug.aiAnalysis = { ...output, generatedAt: new Date() };
  await bug.save();

  res.status(200).json({ success: true, data: output, disclaimer: 'AI Recommendation, not a guaranteed diagnosis.' });
});

// POST /api/v1/ai/analyze-risk — Manager/Admin only.
const analyzeRisk = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const [tasks, bugs, sprints] = await Promise.all([
    Task.find({ project: project._id }).select('status dueDate priority'),
    Bug.find({ project: project._id }).select('status severity'),
    Sprint.find({ project: project._id }).select('status startDate endDate'),
  ]);

  const now = new Date();
  const metrics = {
    totalTasks: tasks.length,
    overdueTasks: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length,
    criticalOpenBugs: bugs.filter((b) => b.severity === 'CRITICAL' && b.status !== 'CLOSED').length,
    unresolvedBugs: bugs.filter((b) => !['RESOLVED', 'CLOSED'].includes(b.status)).length,
    activeSprintCount: sprints.filter((s) => s.status === 'ACTIVE').length,
    completedTaskRatio: tasks.length ? tasks.filter((t) => t.status === 'DONE').length / tasks.length : 0,
    projectEndDate: project.endDate,
  };

  const output = await runAI({
    user: req.user,
    project,
    type: 'RISK_ANALYSIS',
    input: metrics,
    fn: () => aiService.analyzeRisk(metrics),
  });

  project.riskLevel = output.riskLevel;
  project.riskExplanation = output.explanation;
  project.riskUpdatedAt = new Date();
  await project.save();

  res.status(200).json({ success: true, data: output, disclaimer: 'AI-generated risk indicator.' });
});

// POST /api/v1/ai/summarize-meeting — any authenticated project member.
const summarizeMeeting = asyncHandler(async (req, res) => {
  const { projectId, notes } = req.body;
  if (!notes?.trim()) throw new ApiError(400, 'notes is required');

  let project = null;
  if (projectId) {
    project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, 'Project not found');
    if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');
  }

  const output = await runAI({
    user: req.user,
    project,
    type: 'MEETING_SUMMARY',
    input: { notes },
    fn: () => aiService.summarizeMeeting({ notes, projectName: project?.name }),
  });

  res.status(200).json({ success: true, data: output, disclaimer: 'AI-generated draft. Review and edit before saving.' });
});

// POST /api/v1/ai/parse-task — Manager/Admin only (task creation is a
// managing-role action, same as manual task creation via createTask).
const parseTaskFromText = asyncHandler(async (req, res) => {
  const { projectId, text } = req.body;
  if (!text?.trim()) throw new ApiError(400, 'text is required');

  const project = await Project.findById(projectId).populate('members', 'name').populate('manager', 'name');
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden: only the project manager or an admin can create tasks');

  const members = [project.manager, ...(project.members || [])].filter(Boolean);

  const output = await runAI({
    user: req.user,
    project,
    type: 'TASK_PARSE',
    input: { text },
    fn: () =>
      aiService.parseTaskFromText({
        text,
        referenceDate: new Date().toISOString().slice(0, 10),
        projectName: project.name,
        memberNames: members.map((m) => m.name),
      }),
  });

  // Best-effort match of the AI's free-text assignee mention against real
  // project members, mirroring meetingController's action-item resolution —
  // the frontend still shows this as an editable suggestion, never a fact.
  let suggestedAssigneeId = null;
  if (output.suggestedAssigneeName) {
    const needle = output.suggestedAssigneeName.trim().toLowerCase();
    const match = members.find((m) => {
      const name = m.name.toLowerCase();
      return name.includes(needle) || needle.includes(name.split(' ')[0]);
    });
    if (match) suggestedAssigneeId = match._id;
  }

  res.status(200).json({
    success: true,
    data: { ...output, suggestedAssigneeId },
    disclaimer: 'AI-generated draft. Review and edit before saving.',
  });
});

// POST /api/v1/ai/sprint-retro/:sprintId — Manager/Admin only.
const generateSprintRetro = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.sprintId);
  if (!sprint) throw new ApiError(404, 'Sprint not found');

  const project = await Project.findById(sprint.project);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canManageProject(project, req.user)) throw new ApiError(403, 'Forbidden: only the project manager or an admin can generate a sprint retrospective');

  const [sprintTasks, windowBugs] = await Promise.all([
    Task.find({ sprint: sprint._id }).select('title status priority'),
    Bug.find({
      project: project._id,
      createdAt: { $gte: sprint.startDate, $lte: sprint.endDate },
    }).select('title severity status'),
  ]);

  const completedTasks = sprintTasks.filter((t) => t.status === 'DONE');
  const carriedOverTasks = sprintTasks.filter((t) => t.status !== 'DONE');

  const output = await runAI({
    user: req.user,
    project,
    type: 'SPRINT_RETRO',
    input: { sprintId: sprint._id },
    fn: () =>
      aiService.generateSprintRetro({
        sprintName: sprint.name,
        sprintGoal: sprint.goal,
        completedTasks,
        carriedOverTasks,
        bugsReported: windowBugs,
      }),
  });

  res.status(200).json({ success: true, data: output, disclaimer: 'AI-generated draft. Review and edit before saving.' });
});

module.exports = {
  generateSprintPlan,
  generateUserStory,
  prioritizeTask,
  analyzeBug,
  analyzeRisk,
  summarizeMeeting,
  parseTaskFromText,
  generateSprintRetro,
};
