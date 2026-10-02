import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Sparkles, ListChecks, NotebookPen } from 'lucide-react';
import sprintService from '../../services/sprintService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import RoleGate from '../../components/common/RoleGate';
import Modal from '../../components/common/Modal';
import { SkeletonRows } from '../../components/common/Skeleton';
import AISprintPlannerModal from './AISprintPlannerModal';
import SprintRetroModal from './SprintRetroModal';
import { MANAGING_ROLES } from '../../utils/roles';
import { SPRINT_STATUSES } from '../../utils/constants';
import { formatDate } from '../../utils/format';

function CreateSprintModal({ open, onClose, projectId, onCreated }) {
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sprint = await sprintService.create(projectId, form);
      toast.success('Sprint created');
      onCreated(sprint);
      setForm({ name: '', goal: '', startDate: '', endDate: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Sprint"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            Create Sprint
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Sprint name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Goal</label>
          <textarea
            rows={2}
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Start date</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">End date</label>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectSprints() {
  const { project } = useOutletContext();
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [retroSprint, setRetroSprint] = useState(null);

  const load = async () => {
    try {
      const data = await sprintService.list(project._id);
      setSprints(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  const handleStatusChange = async (sprint, status) => {
    try {
      const updated = await sprintService.update(project._id, sprint._id, { status });
      setSprints((prev) => prev.map((s) => (s._id === sprint._id ? updated : s)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <RoleGate roles={MANAGING_ROLES}>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            New Sprint
          </Button>
          <Button onClick={() => setShowAIPlanner(true)}>
            <Sparkles size={15} />
            AI Sprint Planner
          </Button>
        </RoleGate>
      </div>

      {loading ? (
        <SkeletonRows count={3} />
      ) : sprints.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No sprints yet"
          description="Use the AI Sprint Planner to turn a goal into a reviewable backlog, or create one manually."
        />
      ) : (
        <div className="space-y-3">
          {sprints.map((sprint) => (
            <Card key={sprint._id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{sprint.name}</h3>
                    <Badge value={sprint.status} variant="status" />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{sprint.goal}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(sprint.startDate)} to {formatDate(sprint.endDate)}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <RoleGate roles={MANAGING_ROLES}>
                    {sprint.status === 'COMPLETED' && (
                      <Button variant="secondary" size="sm" onClick={() => setRetroSprint(sprint)}>
                        <NotebookPen size={13} />
                        {sprint.retrospective?.savedAt ? 'View Retrospective' : 'Retrospective'}
                      </Button>
                    )}
                    <Select
                      value={sprint.status}
                      onChange={(status) => handleStatusChange(sprint, status)}
                      options={SPRINT_STATUSES}
                    />
                  </RoleGate>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateSprintModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={project._id}
        onCreated={(sprint) => {
          setSprints((prev) => [...prev, sprint]);
          setShowCreate(false);
        }}
      />

      <AISprintPlannerModal
        open={showAIPlanner}
        onClose={() => setShowAIPlanner(false)}
        project={project}
        onCreated={load}
      />

      <SprintRetroModal
        open={Boolean(retroSprint)}
        onClose={() => setRetroSprint(null)}
        project={project}
        sprint={retroSprint}
        onSaved={(updated) => setSprints((prev) => prev.map((s) => (s._id === updated._id ? updated : s)))}
      />
    </div>
  );
}
