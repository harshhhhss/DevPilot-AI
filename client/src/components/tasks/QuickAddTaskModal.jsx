import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Select from '../common/Select';
import AIBadge from '../common/AIBadge';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import aiService from '../../services/aiService';
import { getErrorMessage } from '../../services/api';
import { aiToast } from '../../utils/aiToast';
import { PRIORITIES } from '../../utils/constants';

// Global "describe it, AI drafts it" quick task creation. Mounted once in
// AppLayout and opened from anywhere via the 'devpilot:quick-add-task'
// window event — the command palette and the Kanban board's Quick Add
// button both just dispatch that event, optionally with a projectId.
export default function QuickAddTaskModal() {
  const [open, setOpen] = useState(false);
  const [lockedProjectId, setLockedProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handleOpen = (e) => {
      const detailProjectId = e.detail?.projectId || null;
      setLockedProjectId(detailProjectId);
      setProjectId(detailProjectId || '');
      setText('');
      setDraft(null);
      setOpen(true);
      if (!detailProjectId) {
        projectService.list().then(setProjects).catch(() => {});
      }
    };
    window.addEventListener('devpilot:quick-add-task', handleOpen);
    return () => window.removeEventListener('devpilot:quick-add-task', handleOpen);
  }, []);

  const reset = () => {
    setText('');
    setDraft(null);
    setProjectMembers([]);
  };

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  const handleParse = async () => {
    if (!projectId || !text.trim()) return;
    setParsing(true);
    try {
      const [{ data }, project] = await Promise.all([
        aiService.parseTask({ projectId, text }),
        projectService.get(projectId),
      ]);
      setProjectMembers([project.manager, ...(project.members || [])].filter(Boolean));
      setDraft({
        title: data.title || '',
        description: data.description || '',
        dueDate: data.dueDate || '',
        priority: data.priority || 'MEDIUM',
        assignee: data.suggestedAssigneeId || '',
      });
      aiToast('Task drafted — review before creating');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!draft.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    try {
      const task = await taskService.create(projectId, {
        title: draft.title,
        description: draft.description,
        dueDate: draft.dueDate || null,
        priority: draft.priority,
        assignee: draft.assignee || null,
      });
      toast.success(`Task "${task.title}" created`);
      window.dispatchEvent(new CustomEvent('devpilot:task-created', { detail: task }));
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-600" />
          Quick Add Task
        </span>
      }
      footer={
        draft && (
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Back
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              Create Task
            </Button>
          </>
        )
      }
    >
      {!draft && (
        <div className="space-y-4">
          {!lockedProjectId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Project</label>
              <Select
                value={projectId}
                onChange={setProjectId}
                options={projects.map((p) => ({ value: p._id, label: p.name }))}
                placeholder="Choose a project"
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Describe the task</label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Fix the login bug, due next Friday, high priority, assign to Diego"
            />
          </div>

          <Button onClick={handleParse} loading={parsing} disabled={!projectId || !text.trim()}>
            <Sparkles size={14} />
            Parse with AI
          </Button>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              Parsing with Gemini...
            </div>
          )}
        </div>
      )}

      {draft && (
        <div className="space-y-4">
          <AIBadge label="AI-generated draft — review and edit before creating" />

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Title</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
            <textarea
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Due date</label>
              <input
                type="date"
                value={draft.dueDate || ''}
                onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Priority</label>
              <Select value={draft.priority} onChange={(v) => setDraft((d) => ({ ...d, priority: v }))} options={PRIORITIES} className="w-full" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Assignee</label>
              <Select
                value={draft.assignee}
                onChange={(v) => setDraft((d) => ({ ...d, assignee: v }))}
                options={projectMembers.map((m) => ({ value: m._id, label: m.name }))}
                placeholder="Unassigned"
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
