import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import taskService from '../../services/taskService';
import sprintService from '../../services/sprintService';
import { getErrorMessage } from '../../services/api';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import RoleGate from '../../components/common/RoleGate';
import TaskDetailPanel from '../../components/tasks/TaskDetailPanel';
import { SkeletonRows } from '../../components/common/Skeleton';
import { MANAGING_ROLES } from '../../utils/roles';
import { useAuth } from '../../hooks/useAuth';

function NewTaskModal({ open, onClose, projectId, sprints, onCreated }) {
  const [form, setForm] = useState({ title: '', sprint: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const task = await taskService.create(projectId, { ...form, sprint: form.sprint || null });
      toast.success('Task created');
      onCreated(task);
      setForm({ title: '', sprint: '' });
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
      title="New Task"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            Create Task
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Sprint</label>
          <Select
            value={form.sprint}
            onChange={(sprint) => setForm({ ...form, sprint })}
            options={sprints.map((s) => ({ value: s._id, label: s.name }))}
            placeholder="Backlog (no sprint)"
            className="w-full"
          />
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectKanban() {
  const { project } = useOutletContext();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sprintFilter, setSprintFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    try {
      const [taskData, sprintData] = await Promise.all([
        taskService.listForProject(project._id),
        sprintService.list(project._id),
      ]);
      setTasks(taskData);
      setSprints(sprintData);
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

  const handleStatusChange = async (task, newStatus) => {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t)));
    try {
      await taskService.update(task._id, { status: newStatus });
    } catch (err) {
      setTasks(previous);
      toast.error(getErrorMessage(err));
    }
  };

  const handleTaskUpdate = (updated) => {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    setSelectedTask(updated);
  };

  const handleDelete = async () => {
    try {
      await taskService.remove(selectedTask._id);
      setTasks((prev) => prev.filter((t) => t._id !== selectedTask._id));
      setSelectedTask(null);
      setConfirmDelete(false);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const visibleTasks = sprintFilter ? tasks.filter((t) => t.sprint === sprintFilter || t.sprint?._id === sprintFilter) : tasks;

  // Mirrors the backend's canChangeStatus check so a card only looks
  // draggable when the drop would actually be accepted, instead of letting
  // anyone drag and then snapping the card back with an error toast.
  const canDragTask = (task) => {
    const isAdmin = user.role === 'Admin';
    const isThisProjectManager = String(project.manager?._id) === String(user._id);
    const isAssignee = task.assignee && String(task.assignee._id || task.assignee) === String(user._id);
    return isAdmin || isThisProjectManager || Boolean(isAssignee);
  };

  if (loading) return <SkeletonRows count={4} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          value={sprintFilter}
          onChange={setSprintFilter}
          options={sprints.map((s) => ({ value: s._id, label: s.name }))}
          placeholder="All sprints"
        />
        <RoleGate roles={MANAGING_ROLES}>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            New Task
          </Button>
        </RoleGate>
      </div>

      <KanbanBoard
        tasks={visibleTasks}
        onTaskClick={setSelectedTask}
        onStatusChange={handleStatusChange}
        canDragTask={canDragTask}
      />

      <Modal open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} title="Task Details" size="lg">
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            onUpdate={handleTaskUpdate}
            onDelete={() => setConfirmDelete(true)}
            assignableUsers={[project.manager, ...project.members]}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete task?"
        description="This will permanently remove the task and its comments."
        confirmLabel="Delete"
      />

      <NewTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={project._id}
        sprints={sprints}
        onCreated={(task) => {
          setTasks((prev) => [task, ...prev]);
          setShowCreate(false);
        }}
      />
    </div>
  );
}
