import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, CheckCircle2, ListPlus, Plus, Trash2 } from 'lucide-react';
import meetingService from '../../services/meetingService';
import aiService from '../../services/aiService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import AIBadge from '../../components/common/AIBadge';
import EditableList from '../../components/common/EditableList';
import { AIThinking, AIErrorBanner } from '../../components/common/AIStatus';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRows } from '../../components/common/Skeleton';
import { aiToast } from '../../utils/aiToast';
import { formatDate } from '../../utils/format';

// Each action item is becoming a real Task (via "Convert to task" once
// saved), so unlike a plain string list, the description/assignee/deadline
// need to be independently editable before the meeting record is saved.
function EditableActionItems({ items, onChange }) {
  const update = (i, patch) => onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { description: '', assigneeName: '', deadline: '' }]);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-md border border-slate-200 bg-white p-2">
          <div className="grid flex-1 grid-cols-1 gap-1.5 sm:grid-cols-[1fr_auto_auto]">
            <input
              value={item.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="What needs to happen"
              className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
            />
            <input
              value={item.assigneeName}
              onChange={(e) => update(i, { assigneeName: e.target.value })}
              placeholder="Assignee"
              className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none sm:w-28"
            />
            <input
              value={item.deadline || ''}
              onChange={(e) => update(i, { deadline: e.target.value })}
              placeholder="Deadline"
              className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none sm:w-28"
            />
          </div>
          <button type="button" onClick={() => remove(i)} className="mt-1 flex-none rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
        <Plus size={12} /> Add action item
      </button>
      {items.length === 0 && <p className="text-xs text-slate-400">No action items drafted.</p>}
    </div>
  );
}

export default function ProjectMeetings() {
  const { project } = useOutletContext();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState('');

  const load = () => meetingService.list(project._id).then(setMeetings).finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  const handleSummarize = async () => {
    if (!notes.trim()) return;
    setGenerating(true);
    setGenError('');
    try {
      const { data } = await aiService.summarizeMeeting({ projectId: project._id, notes });
      setDraft(data);
      aiToast('Meeting summarized. Review before saving.');
    } catch (err) {
      setGenError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !draft) return;
    setSaving(true);
    try {
      const cleaned = {
        ...draft,
        keyDecisions: (draft.keyDecisions || []).map((d) => d.trim()).filter(Boolean),
        actionItems: (draft.actionItems || [])
          .filter((item) => item.description?.trim())
          .map((item) => ({ ...item, description: item.description.trim() })),
      };
      await meetingService.create(project._id, { title, notes, ...cleaned });
      toast.success('Meeting summary saved');
      setTitle('');
      setNotes('');
      setDraft(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async (meetingId, itemId) => {
    try {
      await meetingService.convertActionItem(project._id, meetingId, itemId);
      toast.success('Task created from action item');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-600" />
          <h3 className="text-sm font-semibold text-slate-900">AI Meeting Summarizer</h3>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Meeting title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Sprint Planning Sync"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Paste meeting notes or transcript</label>
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <Button onClick={handleSummarize} loading={generating} disabled={!notes.trim()}>
          <Sparkles size={14} />
          Summarize with AI
        </Button>

        {generating && <AIThinking label="Summarizing the meeting with Gemini..." />}
        {genError && !generating && <AIErrorBanner message={genError} onRetry={handleSummarize} />}

        {draft && !generating && (
          <div className="space-y-4 rounded-lg border border-violet-100 bg-violet-50/40 p-4">
            <AIBadge label="AI-generated draft. Review and edit before saving." tone="draft" />
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600">Summary</p>
              <textarea
                rows={2}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600">Key decisions</p>
              <EditableList
                items={draft.keyDecisions || []}
                onChange={(keyDecisions) => setDraft({ ...draft, keyDecisions })}
                addLabel="Add decision"
                emptyLabel="No key decisions drafted."
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600">Action items</p>
              <EditableActionItems
                items={draft.actionItems || []}
                onChange={(actionItems) => setDraft({ ...draft, actionItems })}
              />
            </div>
            <Button size="sm" onClick={handleSave} loading={saving} disabled={!title.trim()}>
              Save Meeting Summary
            </Button>
          </div>
        )}
      </Card>

      {loading ? (
        <SkeletonRows count={2} />
      ) : meetings.length === 0 ? (
        <EmptyState title="No meeting summaries yet" description="Paste notes above and let AI draft a summary." />
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Card key={meeting._id} className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-800">{meeting.title}</h4>
                <span className="text-xs text-slate-400">{formatDate(meeting.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-600">{meeting.summary}</p>
              {meeting.actionItems?.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {meeting.actionItems.map((item) => (
                    <div key={item._id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-700">
                        {item.description}
                        {item.assigneeName && <span className="text-slate-400"> · {item.assigneeName}</span>}
                        {item.deadline && <span className="text-slate-400"> (due {item.deadline})</span>}
                      </span>
                      {item.convertedToTask ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 size={13} /> Task created
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConvert(meeting._id, item._id)}
                          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                        >
                          <ListPlus size={13} /> Convert to task
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
