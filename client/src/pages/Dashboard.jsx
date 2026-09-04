import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, ListChecks, Bug, AlertTriangle } from 'lucide-react';
import analyticsService from '../services/analyticsService';
import projectService from '../services/projectService';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { Skeleton } from '../components/common/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsService.getOverview(), projectService.list()])
      .then(([overviewData, projectsData]) => {
        setOverview(overviewData);
        setProjects(projectsData.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening across your projects.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={FolderKanban} label="Active Projects" value={overview?.activeProjects ?? 0} hint={`${overview?.totalProjects ?? 0} total`} />
          <StatCard
            icon={ListChecks}
            label="Tasks Completed"
            value={overview?.completedTasks ?? 0}
            hint={`${overview?.pendingTasks ?? 0} pending`}
            accent="text-emerald-600 bg-emerald-50"
          />
          <StatCard icon={Bug} label="Open Bugs" value={overview?.openBugs ?? 0} accent="text-rose-600 bg-rose-50" />
          <StatCard
            icon={AlertTriangle}
            label="Critical Bugs"
            value={overview?.criticalBugs ?? 0}
            hint={overview?.highRiskProjects ? `${overview.highRiskProjects} high-risk projects` : undefined}
            accent="text-amber-600 bg-amber-50"
          />
        </div>
      )}

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Recent Projects</h3>
          <Link to="/projects" className="text-xs font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start planning sprints and tracking work."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((project) => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="flex items-center justify-between gap-4 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{project.name}</p>
                  <p className="text-xs text-slate-500">Due {formatDate(project.endDate)}</p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  {project.riskLevel && <Badge value={project.riskLevel} variant="risk" />}
                  <Badge value={project.status} variant="status" />
                  <div className="hidden w-28 items-center gap-2 sm:flex">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{project.progress}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
