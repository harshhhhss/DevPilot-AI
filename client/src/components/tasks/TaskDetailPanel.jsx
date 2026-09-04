import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Send, Trash2 } from 'lucide-react';
import taskService from '../../services/taskService';
import aiService from '../../services/aiService';
import { getErrorMessage } from '../../services/api';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Select from '../common/Select';
import AIBadge from '../common/AIBadge';
import RoleGate from '../common/RoleGate';
import { aiToast } from '../../utils/aiToast';
import { PRIORITIES, TASK_STATUSES } from '../../utils/constants';
import { MANAGING_ROLES, ROLES } from '../../utils/roles';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatRelativeTime } from '../../utils/format';

export default function TaskDetailPanel({ task, onUpdate, onDelete, assignableUsers = [] }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [prioritizing, setPrioritizing] = useState(false);

  const canEditDetails = MANAGING_ROLES.includes(user.role);
  const canChangeStatus = canEditDetails || String(task.assignee?._id) === String(user._id);

  useEffect(() => {
    setLoadingComments(true);
    taskService
      .listComments(task._id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [task._id]);

  const patch = async (fields) => {
    try {
      const updated = await taskService.update(task._id, fields);
      onUpdate(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const comment = await taskService.addComment(task._id, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePrioritize = async () => {
    setPrioritizing(true);
    try {
      const { data } = await aiService.prioritizeTask({ taskId: task._id });
      onUpdate({ ...task, aiSuggestedPriority: data.suggestedPriority, aiPriorityReason: data.reason });
      aiToast('Priority suggestion ready');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPrioritizing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        {canEditDetails ? (
          <input
            value={task.title}
            onChange={(e) => onUpdate({ ...task, title: e.target.value })}
            onBlur={(e) => patch({ title: e.target.value })}
            className="w-full flex-1 rounded-md border border-transparent px-1 py-0.5 text-lg font-semibold text-slate-900 hover:border-slate-200 focus:border-brand-500 focus:outline-none"
          />
        ) : (
          <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
        )}
        <RoleGate roles={MANAGING_ROLES}>
          <button
            type="button"
            onClick={onDelete}
            className="flex-none rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={16} />
          </button>
        </RoleGate>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Status</p>
          {canChangeStatus ? (
            <Select value={task.status} onChange={(status) => patch({ status })} options={TASK_STATUSES} className="w-full text-xs" />
          ) : (
            <Badge value={task.status} variant="status" />
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Priority</p>
          {canEditDetails ? (
            <Select value={task.priority} onChange={(priority) => patch({ priority })} options={PRIORITIES} className="w-full text-xs" />
          ) : (
            <Badge value={task.priority} variant="priority" />
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Assignee</p>
          {canEditDetails ? (
            <Select
              value={task.assignee?._id || ''}
              onChange={(assignee) => patch({ assignee: assignee || null })}
              options={assignableUsers.map((u) => ({ value: u._id, label: u.name }))}
              placeholder="Unassigned"
              className="w-full text-xs"
            />
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-slate-700">
              {task.assignee ? (
                <>
                  <Avatar name={task.assignee.name} size="sm" />
                  {task.assignee.name}
                </>
              ) : (
                'Unassigned'
              )}
            </p>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Due date</p>
          {canEditDetails ? (
            <input
              type="date"
              value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
              onChange={(e) => patch({ dueDate: e.target.value || null })}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
            />
          ) : (
            <p className="text-sm text-slate-700">{formatDate(task.dueDate)}</p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-slate-500">Description</p>
        {canEditDetails ? (
          <textarea
            rows={4}
            value={task.description || ''}
            onChange={(e) => onUpdate({ ...task, description: e.target.value })}
            onBlur={(e) => patch({ description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        ) : (
          <p className="whitespace-pre-line text-sm text-slate-600">{task.description || 'No description.'}</p>
        )}
      </div>

      {task.acceptanceCriteria?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Acceptance criteria</p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-600">
            {task.acceptanceCriteria.map((ac, i) => (
              <li key={i}>{ac}</li>
            ))}
          </ul>
        </div>
      )}

      <RoleGate roles={MANAGING_ROLES}>
        <div className="rounded-lg border border-violet-100 bg-violet-50/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-violet-700">AI Task Prioritization</p>
            <Button variant="ghost" size="sm" onClick={handlePrioritize} loading={prioritizing}>
              <Sparkles size={13} />
              Suggest priority
            </Button>
          </div>
          {task.aiSuggestedPriority && (
            <div className="mt-2 flex items-start gap-2">
              <AIBadge />
              <p className="text-xs text-slate-600">
                Suggests <strong>{task.aiSuggestedPriority}</strong> — {task.aiPriorityReason}
              </p>
            </div>
          )}
        </div>
      </RoleGate>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">Comments</p>
        <div className="max-h-56 space-y-3 overflow-y-auto">
          {!loadingComments && comments.length === 0 && <p className="text-xs text-slate-400">No comments yet.</p>}
          {comments.map((c) => (
            <div key={c._id} className="flex gap-2">
              <Avatar name={c.author?.name} size="sm" />
              <div>
                <p className="text-xs font-medium text-slate-700">
                  {c.author?.name} <span className="ml-1 font-normal text-slate-400">{formatRelativeTime(c.createdAt)}</span>
                </p>
                <p className="text-sm text-slate-600">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        {user.role === ROLES.STAKEHOLDER ? (
          <p className="mt-3 text-xs text-slate-400">Stakeholders have read-only access to comments.</p>
        ) : (
        <form onSubmit={handleComment} className="mt-3 flex items-center gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment... use @Name to mention"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <Button type="submit" size="sm">
            <Send size={13} />
          </Button>
        </form>
        )}
      </div>
    </div>
  );
}
