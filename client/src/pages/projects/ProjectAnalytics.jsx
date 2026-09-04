import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import analyticsService from '../../services/analyticsService';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Avatar from '../../components/common/Avatar';
import { Skeleton } from '../../components/common/Skeleton';
import { ListChecks, Bug, AlertTriangle, TrendingUp } from 'lucide-react';

const STATUS_COLORS = ['#94a3b8', '#3766f7', '#8b5cf6', '#10b981'];
const SEVERITY_COLORS = ['#94a3b8', '#3766f7', '#f59e0b', '#e11d48'];

export default function ProjectAnalytics() {
  const { project } = useOutletContext();
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsService.getProjectAnalytics(project._id).then(setData);
  }, [project._id]);

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Tasks Completed" value={`${data.completedTasks}/${data.totalTasks}`} />
        <StatCard icon={Bug} label="Open Bugs" value={data.openBugs} accent="text-rose-600 bg-rose-50" />
        <StatCard icon={AlertTriangle} label="Critical Bugs" value={data.criticalBugs} accent="text-amber-600 bg-amber-50" />
        <StatCard icon={TrendingUp} label="Overdue Tasks" value={data.overdueTasks} accent="text-violet-600 bg-violet-50" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Task Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.taskStatusBreakdown} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {data.taskStatusBreakdown.map((entry, i) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Open Bugs by Severity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.bugSeverityBreakdown}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="severity" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.bugSeverityBreakdown.map((entry, i) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Team Workload</h3>
        {data.teamWorkload.length === 0 ? (
          <p className="text-sm text-slate-400">No tasks assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {data.teamWorkload.map(({ user, taskCount }) => (
              <div key={user?._id} className="flex items-center gap-3">
                <Avatar name={user?.name} size="sm" />
                <span className="w-32 flex-none truncate text-sm text-slate-700">{user?.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${Math.min(100, (taskCount / Math.max(...data.teamWorkload.map((w) => w.taskCount))) * 100)}%` }}
                  />
                </div>
                <span className="w-10 flex-none text-right text-xs text-slate-500">{taskCount}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
