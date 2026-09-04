export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export const TASK_STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const BUG_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const BUG_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];

export const SPRINT_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED'];

export const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];

export const PRIORITY_COLORS = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const SEVERITY_COLORS = PRIORITY_COLORS;

export const STATUS_COLORS = {
  TODO: 'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_REVIEW: 'bg-violet-50 text-violet-700 border-violet-200',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OPEN: 'bg-rose-50 text-rose-700 border-rose-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  REOPENED: 'bg-amber-50 text-amber-700 border-amber-200',
  PLANNED: 'bg-slate-100 text-slate-700 border-slate-200',
  ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PLANNING: 'bg-slate-100 text-slate-700 border-slate-200',
  ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  ARCHIVED: 'bg-slate-200 text-slate-600 border-slate-300',
};

export const RISK_COLORS = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
};
