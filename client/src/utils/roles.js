export const ROLES = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  DEVELOPER: 'Developer',
  TESTER: 'Tester',
  STAKEHOLDER: 'Stakeholder',
};

export const MANAGING_ROLES = [ROLES.ADMIN, ROLES.PROJECT_MANAGER];
export const CONTRIBUTOR_ROLES = [ROLES.DEVELOPER, ROLES.TESTER];
export const ALL_ROLES = Object.values(ROLES);

export const isManagingRole = (role) => MANAGING_ROLES.includes(role);
