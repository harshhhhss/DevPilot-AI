const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { canViewProject } = require('../utils/accessControl');
const { ROLES } = require('../utils/roles');
const { notifyMany } = require('../services/notificationService');
const { emitToProject } = require('../socket');

const MODEL_BY_TYPE = { Task, Bug };

const loadEntityAndProject = async (entityType, entityId) => {
  const Model = MODEL_BY_TYPE[entityType];
  if (!Model) throw new ApiError(400, 'Invalid entity type');

  const entity = await Model.findById(entityId);
  if (!entity) throw new ApiError(404, `${entityType} not found`);

  const project = await Project.findById(entity.project).populate('members', 'name').populate('manager', 'name');
  if (!project) throw new ApiError(404, 'Project not found');

  return { entity, project };
};

// Mentions are @Name matches against the project's member list, keeping
// mention resolution scoped and avoiding an extra client-side lookup call.
const resolveMentions = (content, project) => {
  const names = [project.manager, ...project.members].filter(Boolean);
  const mentioned = [];

  names.forEach((member) => {
    const memberName = member.name || '';
    if (memberName && content.includes(`@${memberName}`)) {
      mentioned.push(member._id || member);
    }
  });

  return [...new Set(mentioned.map(String))];
};

const listComments = asyncHandler(async (req, res) => {
  const entityType = req.commentEntityType;
  const entityId = req.params.id;

  const { project } = await loadEntityAndProject(entityType, entityId);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  const comments = await Comment.find({ entityType, entityId })
    .populate('author', 'name avatar role')
    .sort({ createdAt: 1 });

  res.status(200).json({ success: true, data: comments });
});

const createComment = asyncHandler(async (req, res) => {
  const entityType = req.commentEntityType;
  const entityId = req.params.id;
  const { content } = req.body;

  if (!content?.trim()) throw new ApiError(400, 'Comment content is required');

  const { entity, project } = await loadEntityAndProject(entityType, entityId);
  if (!canViewProject(project, req.user)) throw new ApiError(403, 'Forbidden');

  // SRS 5.2: "Post chat messages & comments" is Allow for Manager/Dev/Tester/Admin, Deny for Viewer.
  if (req.user.role === ROLES.STAKEHOLDER) {
    throw new ApiError(403, 'Forbidden: stakeholders have read-only access');
  }

  const mentions = resolveMentions(content, project);

  const comment = await Comment.create({
    entityType,
    entityId,
    project: project._id,
    author: req.user._id,
    content: content.trim(),
    mentions,
  });

  await comment.populate('author', 'name avatar role');

  emitToProject(String(project._id), 'comment:created', comment);

  const notifyTargets = new Set(mentions);
  if (entity.assignee) notifyTargets.add(String(entity.assignee));
  if (entity.assignedDeveloper) notifyTargets.add(String(entity.assignedDeveloper));
  if (entity.reporter) notifyTargets.add(String(entity.reporter));

  await notifyMany({
    userIds: [...notifyTargets],
    actingUserId: req.user._id,
    type: mentions.length ? 'MENTION' : 'COMMENT_ADDED',
    message: `${req.user.name} commented on "${entity.title}"`,
    relatedEntity: { entityType, entityId },
  });

  res.status(201).json({ success: true, data: comment });
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');

  const isAuthor = String(comment.author) === String(req.user._id);
  const isPrivileged = ['Admin', 'Project Manager'].includes(req.user.role);

  if (!isAuthor && !isPrivileged) throw new ApiError(403, 'Forbidden: you can only delete your own comments');

  await comment.deleteOne();

  res.status(200).json({ success: true, message: 'Comment deleted' });
});

module.exports = { listComments, createComment, deleteComment };
