import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import projectService from '../../services/projectService';
import { getErrorMessage } from '../../services/api';
import Badge from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { formatDate } from '../../utils/format';

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'sprints', label: 'Sprints' },
  { to: 'kanban', label: 'Kanban' },
  { to: 'bugs', label: 'Bugs' },
  { to: 'chat', label: 'Chat' },
  { to: 'meetings', label: 'AI Meetings' },
  { to: 'team', label: 'Team' },
  { to: 'analytics', label: 'Analytics' },
];

export default function ProjectDetailLayout() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await projectService.get(id);
      setProject(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
          <Badge value={project.status} variant="status" />
          {project.riskLevel && <Badge value={project.riskLevel} variant="risk" />}
        </div>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{project.description}</p>
        <p className="mt-1 text-xs text-slate-400">
          {formatDate(project.startDate)} to {formatDate(project.endDate)} · Managed by {project.manager?.name}
        </p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex-none border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ project, reload }} />
    </div>
  );
}
