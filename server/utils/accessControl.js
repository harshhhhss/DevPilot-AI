const { ROLES } = require('./roles');

const isAdmin = (user) => user.role === ROLES.ADMIN;

const isManagerRole = (user) => user.role === ROLES.ADMIN || user.role === ROLES.PROJECT_MANAGER;

const isProjectManagerOf = (project, userId) => String(project.manager?._id || project.manager) === String(userId);

const isProjectMember = (project, userId) => {
  const id = String(userId);
  const members = (project.members || []).map((m) => String(m?._id || m));
  return isProjectManagerOf(project, userId) || members.includes(id);
};

// Anyone who should be able to *see* the project: its manager, its members,
// or an Administrator (SRS 5.2 grants Admin full administrative access).
const canViewProject = (project, user) => isAdmin(user) || isProjectMember(project, user._id);

// Only the project's manager or an Administrator may change project/sprint
// configuration (SRS 5.2: "Create/archive project, define sprint" -> Manager, Admin only).
const canManageProject = (project, user) => isAdmin(user) || isProjectManagerOf(project, user._id);

module.exports = {
  isAdmin,
  isManagerRole,
  isProjectManagerOf,
  isProjectMember,
  canViewProject,
  canManageProject,
};
