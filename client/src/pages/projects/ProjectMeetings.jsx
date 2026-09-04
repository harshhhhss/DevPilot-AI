import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, CheckCircle2, ListPlus } from 'lucide-react';
import meetingService from '../../services/meetingService';
import aiService from '../../services/aiService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import AIBadge from '../../components/common/AIBadge';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRows } from '../../components/common/Skeleton';
import TypewriterText from '../../components/common/TypewriterText';
import { aiToast } from '../../utils/aiToast';
import { formatDate } from '../../utils/format';

export default function ProjectMeetings() {
  const { project } = useOutletContext();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => meetingService.list(project._id).then(setMeetings).finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  const handleSummarize = async () => {
    if (!notes.trim()) return;
    setGenerating(true);
    try {
      const { data } = await aiService.summarizeMeeting({ projectId: project._id, notes });
      setDraft(data);
      aiToast('Meeting summarized — review before saving');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !draft) return;
    setSaving(true);
    try {
      await meetingService.create(project._id, { title, notes, ...draft });
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

        {draft && (
          <div className="space-y-3 rounded-lg border border-violet-100 bg-violet-50/40 p-4">
            <AIBadge label="AI-generated draft — review and edit before saving" />
            <div>
              <p className="text-xs font-medium text-slate-600">Summary</p>
              <textarea
                rows={2}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            {draft.keyDecisions?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-600">Key decisions</p>
                <ul className="list-inside list-disc text-sm text-slate-600">
                  {draft.keyDecisions.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
            {draft.actionItems?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-600">Action items</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {draft.actionItems.map((item, i) => (
                    <li key={i}>
                      {item.description}
                      {item.assigneeName && <span className="text-slate-400"> — {item.assigneeName}</span>}
                      {item.deadline && <span className="text-slate-400"> (due {item.deadline})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                        {item.assigneeName && <span className="text-slate-400"> — {item.assigneeName}</span>}
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
