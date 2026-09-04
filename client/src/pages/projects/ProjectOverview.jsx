import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import AIBadge from '../../components/common/AIBadge';
import RoleGate from '../../components/common/RoleGate';
import ActivityFeed from '../../components/common/ActivityFeed';
import aiService from '../../services/aiService';
import { getErrorMessage } from '../../services/api';
import { MANAGING_ROLES } from '../../utils/roles';
import { formatDateTime } from '../../utils/format';

export default function ProjectOverview() {
  const { project, reload } = useOutletContext();
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeRisk = async () => {
    setAnalyzing(true);
    try {
      await aiService.analyzeRisk({ projectId: project._id });
      toast.success('Risk analysis updated');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Progress</h3>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${project.progress}%` }} />
            </div>
            <span className="text-sm font-medium text-slate-600">{project.progress}%</span>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Team</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5">
              <Avatar name={project.manager?.name} size="sm" />
              <div>
                <p className="text-xs font-medium text-slate-800">{project.manager?.name}</p>
                <p className="text-[11px] text-slate-500">Project Manager</p>
              </div>
            </div>
            {project.members?.map((member) => (
              <div key={member._id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5">
                <Avatar name={member.name} size="sm" />
                <div>
                  <p className="text-xs font-medium text-slate-800">{member.name}</p>
                  <p className="text-[11px] text-slate-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Activity</h3>
          <ActivityFeed projectId={project._id} />
        </Card>
      </div>

      <Card className="h-fit p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">AI Risk Analysis</h3>
          {project.riskLevel && <Badge value={project.riskLevel} variant="risk" />}
        </div>

        {project.riskExplanation ? (
          <div className="space-y-2">
            <AIBadge />
            <p className="text-sm text-slate-600">{project.riskExplanation}</p>
            {project.riskUpdatedAt && (
              <p className="text-xs text-slate-400">Updated {formatDateTime(project.riskUpdatedAt)}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No risk analysis yet.</p>
        )}

        <RoleGate roles={MANAGING_ROLES}>
          <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={handleAnalyzeRisk} loading={analyzing}>
            <Sparkles size={14} />
            {project.riskExplanation ? 'Re-run Risk Analysis' : 'Run AI Risk Analysis'}
          </Button>
        </RoleGate>
      </Card>
    </div>
  );
}
