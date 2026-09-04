import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, FolderKanban } from 'lucide-react';
import projectService from '../../services/projectService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import RoleGate from '../../components/common/RoleGate';
import { SkeletonCardGrid } from '../../components/common/Skeleton';
import CreateProjectModal from './CreateProjectModal';
import { PROJECT_STATUSES } from '../../utils/constants';
import { MANAGING_ROLES } from '../../utils/roles';
import { formatDate } from '../../utils/format';

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await projectService.list({ search: search || undefined, status: status || undefined });
      setProjects(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." className="w-64" />
          <Select value={status} onChange={setStatus} options={PROJECT_STATUSES} placeholder="All statuses" />
        </div>
        <RoleGate roles={MANAGING_ROLES}>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            New Project
          </Button>
        </RoleGate>
      </div>

      {loading ? (
        <SkeletonCardGrid />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Create a project to start planning sprints, assigning tasks, and tracking bugs."
          action={
            <RoleGate roles={MANAGING_ROLES}>
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} />
                New Project
              </Button>
            </RoleGate>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`}>
              <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{project.name}</h3>
                  <Badge value={project.status} variant="status" />
                </div>
                <p className="line-clamp-2 flex-1 text-sm text-slate-500">{project.description || 'No description provided.'}</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${project.progress}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{project.progress}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Manager: {project.manager?.name || '—'}</span>
                  <span>Due {formatDate(project.endDate)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(project) => {
          setProjects((prev) => [project, ...prev]);
          setShowCreate(false);
        }}
      />
    </div>
  );
}
