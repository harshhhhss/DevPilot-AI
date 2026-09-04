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

// Project ids a user may see on a cross-project (flat) listing: every project
// in their organization for an Admin, or just the ones they manage/belong to
// otherwise. Always scoped to the user's own organization — without this an
// Admin's "see everything" path would leak data across other organizations.
// Takes the Project model as a parameter to keep this util decoupled from models/.
const getAccessibleProjectIds = async (Project, user) => {
  const filter = { organization: user.organization };
  if (!isAdmin(user)) {
    filter.$or = [{ manager: user._id }, { members: user._id }];
  }
  const projects = await Project.find(filter).select('_id');
  return projects.map((p) => p._id);
};

module.exports = {
  isAdmin,
  isManagerRole,
  isProjectManagerOf,
  isProjectMember,
  canViewProject,
  canManageProject,
  getAccessibleProjectIds,
};
