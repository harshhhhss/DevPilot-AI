import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Send } from 'lucide-react';
import bugService from '../../services/bugService';
import aiService from '../../services/aiService';
import { getErrorMessage } from '../../services/api';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Select from '../common/Select';
import AIBadge from '../common/AIBadge';
import RoleGate from '../common/RoleGate';
import { BUG_SEVERITIES, BUG_STATUSES } from '../../utils/constants';
import { MANAGING_ROLES } from '../../utils/roles';
import { useAuth } from '../../hooks/useAuth';
import { formatRelativeTime } from '../../utils/format';

export default function BugDetailPanel({ bug, onUpdate, assignableUsers = [] }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const canEdit =
    MANAGING_ROLES.includes(user.role) ||
    String(bug.reporter?._id) === String(user._id) ||
    String(bug.assignedDeveloper?._id) === String(user._id);

  useEffect(() => {
    bugService
      .listComments(bug._id)
      .then(setComments)
      .catch(() => {});
  }, [bug._id]);

  const patch = async (fields) => {
    try {
      const updated = await bugService.update(bug._id, fields);
      onUpdate(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const comment = await bugService.addComment(bug._id, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await aiService.analyzeBug({ bugId: bug._id });
      onUpdate({ ...bug, aiAnalysis: { ...data, generatedAt: new Date().toISOString() } });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{bug.title}</h3>
        <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{bug.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Status</p>
          {canEdit ? (
            <Select value={bug.status} onChange={(status) => patch({ status })} options={BUG_STATUSES} className="w-full text-xs" />
          ) : (
            <Badge value={bug.status} variant="status" />
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Severity</p>
          {canEdit ? (
            <Select value={bug.severity} onChange={(severity) => patch({ severity })} options={BUG_SEVERITIES} className="w-full text-xs" />
          ) : (
            <Badge value={bug.severity} variant="priority" />
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Assigned developer</p>
          {canEdit ? (
            <Select
              value={bug.assignedDeveloper?._id || ''}
              onChange={(assignedDeveloper) => patch({ assignedDeveloper: assignedDeveloper || null })}
              options={assignableUsers.map((u) => ({ value: u._id, label: u.name }))}
              placeholder="Unassigned"
              className="w-full text-xs"
            />
          ) : (
            <p className="text-sm text-slate-700">{bug.assignedDeveloper?.name || 'Unassigned'}</p>
          )}
        </div>
      </div>

      {(bug.stepsToReproduce || bug.expectedResult || bug.actualResult) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {bug.stepsToReproduce && (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Steps to reproduce</p>
              <p className="whitespace-pre-line text-xs text-slate-600">{bug.stepsToReproduce}</p>
            </div>
          )}
          {bug.expectedResult && (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Expected result</p>
              <p className="text-xs text-slate-600">{bug.expectedResult}</p>
            </div>
          )}
          {bug.actualResult && (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Actual result</p>
              <p className="text-xs text-slate-600">{bug.actualResult}</p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-violet-100 bg-violet-50/50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-violet-700">AI Bug Analyzer</p>
          <Button variant="ghost" size="sm" onClick={handleAnalyze} loading={analyzing}>
            <Sparkles size={13} />
            Analyze with AI
          </Button>
        </div>
        {bug.aiAnalysis?.generatedAt && (
          <div className="mt-2 space-y-1.5">
            <AIBadge label="AI Recommendation — not a guaranteed diagnosis" />
            <p className="text-xs text-slate-600">
              <strong>Possible cause:</strong> {bug.aiAnalysis.possibleCause}
            </p>
            <p className="text-xs text-slate-600">
              <strong>Suggested severity:</strong> {bug.aiAnalysis.suggestedSeverity} ·{' '}
              <strong>Affected module:</strong> {bug.aiAnalysis.affectedModule}
            </p>
            {bug.aiAnalysis.debuggingSuggestions?.length > 0 && (
              <div>
                <strong className="text-xs text-slate-600">Debugging suggestions:</strong>
                <ul className="list-inside list-disc text-xs text-slate-600">
                  {bug.aiAnalysis.debuggingSuggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {bug.aiAnalysis.nextSteps?.length > 0 && (
              <div>
                <strong className="text-xs text-slate-600">Recommended next steps:</strong>
                <ul className="list-inside list-disc text-xs text-slate-600">
                  {bug.aiAnalysis.nextSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">Comments</p>
        <div className="max-h-56 space-y-3 overflow-y-auto">
          {comments.length === 0 && <p className="text-xs text-slate-400">No comments yet.</p>}
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
        <form onSubmit={handleComment} className="mt-3 flex items-center gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <Button type="submit" size="sm">
            <Send size={13} />
          </Button>
        </form>
      </div>
    </div>
  );
}
