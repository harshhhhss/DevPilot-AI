import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import analyticsService from '../services/analyticsService';
import projectService from '../services/projectService';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { FolderKanban, ListChecks, Bug, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/format';

const COLORS = ['#10b981', '#3766f7', '#94a3b8'];

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    analyticsService.getOverview().then(setOverview);
    projectService.list().then(setProjects);
  }, []);

  if (!overview) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const projectStatusData = [
    { name: 'Completed', value: overview.completedProjects },
    { name: 'Active', value: overview.activeProjects },
    { name: 'Other', value: Math.max(0, overview.totalProjects - overview.completedProjects - overview.activeProjects) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={overview.totalProjects} />
        <StatCard icon={ListChecks} label="Tasks Completed" value={`${overview.completedTasks}/${overview.totalTasks}`} accent="text-emerald-600 bg-emerald-50" />
        <StatCard icon={Bug} label="Open Bugs" value={overview.openBugs} accent="text-rose-600 bg-rose-50" />
        <StatCard icon={AlertTriangle} label="High-Risk Projects" value={overview.highRiskProjects} accent="text-amber-600 bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Project Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={projectStatusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {projectStatusData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Projects Overview</h3>
          <div className="divide-y divide-slate-100">
            {projects.map((project) => (
              <Link key={project._id} to={`/projects/${project._id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{project.name}</p>
                  <p className="text-xs text-slate-500">Due {formatDate(project.endDate)}</p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {project.riskLevel && <Badge value={project.riskLevel} variant="risk" />}
                  <span className="text-xs text-slate-500">{project.progress}%</span>
                </div>
              </Link>
            ))}
            {projects.length === 0 && <p className="py-4 text-sm text-slate-400">No projects yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
