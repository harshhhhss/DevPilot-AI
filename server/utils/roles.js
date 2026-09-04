// Role identifiers used across the backend and mirrored on the frontend.
const ROLES = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  DEVELOPER: 'Developer',
  TESTER: 'Tester',
  STAKEHOLDER: 'Stakeholder',
};

// Roles that can plan/manage a project (create/edit/archive projects & sprints,
// invoke AI planning, manage bugs, view analytics) per SRS section 5.2.
const MANAGING_ROLES = [ROLES.ADMIN, ROLES.PROJECT_MANAGER];

// Roles that actively work tasks/bugs (SRS groups Developer & Tester at the
// same "Read/Write (scoped)" privilege level).
const CONTRIBUTOR_ROLES = [ROLES.DEVELOPER, ROLES.TESTER];

// Every authenticated role except read-only viewers.
const WRITE_ROLES = [...MANAGING_ROLES, ...CONTRIBUTOR_ROLES];

const ALL_ROLES = Object.values(ROLES);

module.exports = {
  ROLES,
  MANAGING_ROLES,
  CONTRIBUTOR_ROLES,
  WRITE_ROLES,
  ALL_ROLES,
};
