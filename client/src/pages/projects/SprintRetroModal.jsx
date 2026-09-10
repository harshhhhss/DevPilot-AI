import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import AIBadge from '../../components/common/AIBadge';
import aiService from '../../services/aiService';
import sprintService from '../../services/sprintService';
import { getErrorMessage } from '../../services/api';
import { aiToast } from '../../utils/aiToast';
import { formatDateTime } from '../../utils/format';

const SECTIONS = [
  { key: 'wentWell', label: 'What went well', tone: 'border-emerald-200 bg-emerald-50/40' },
  { key: 'didntGoWell', label: "What didn't go well", tone: 'border-rose-200 bg-rose-50/40' },
  { key: 'improvements', label: 'Suggested improvements', tone: 'border-brand-200 bg-brand-50/40' },
];

function EditableList({ items, onChange }) {
  const update = (i, value) => onChange(items.map((v, idx) => (idx === i ? value : v)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, '']);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <textarea
            rows={1}
            value={item}
            onChange={(e) => update(i, e.target.value)}
            className="w-full flex-1 resize-none rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-1 flex-none rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
        <Plus size={12} /> Add point
      </button>
      {items.length === 0 && <p className="text-xs text-slate-400">Nothing here yet.</p>}
    </div>
  );
}

export default function SprintRetroModal({ open, onClose, project, sprint, onSaved }) {
  const [draft, setDraft] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const saved = sprint?.retrospective;
    setDraft(saved?.savedAt ? { wentWell: saved.wentWell, didntGoWell: saved.didntGoWell, improvements: saved.improvements } : null);
  }, [open, sprint]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await aiService.generateSprintRetro(sprint._id);
      setDraft(data);
      aiToast('Retrospective drafted — review before saving');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await sprintService.saveRetrospective(project._id, sprint._id, draft);
      toast.success('Retrospective saved');
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const alreadySaved = Boolean(sprint?.retrospective?.savedAt);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-600" />
          Sprint Retrospective — {sprint?.name}
        </span>
      }
      footer={
        draft && (
          <>
            <Button variant="secondary" onClick={handleGenerate} loading={generating}>
              <Sparkles size={14} />
              {draft ? 'Regenerate with AI' : 'Generate with AI'}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save Retrospective
            </Button>
          </>
        )
      }
    >
      {!draft && !generating && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-500">
            AI will look at this sprint's completed tasks, carried-over tasks, and bugs reported during the sprint window,
            then draft a retrospective for you to review and edit before saving.
          </p>
          <Button onClick={handleGenerate}>
            <Sparkles size={15} />
            Generate Retrospective
          </Button>
        </div>
      )}

      {generating && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Analyzing sprint data with Gemini...
        </div>
      )}

      {draft && !generating && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AIBadge label="AI-generated draft — review and edit before saving" />
            {alreadySaved && sprint.retrospective.savedAt && (
              <p className="text-xs text-slate-400">Last saved {formatDateTime(sprint.retrospective.savedAt)}</p>
            )}
          </div>

          {SECTIONS.map(({ key, label, tone }) => (
            <div key={key} className={`rounded-lg border p-3 ${tone}`}>
              <p className="mb-2 text-xs font-semibold text-slate-700">{label}</p>
              <EditableList items={draft[key]} onChange={(items) => setDraft((d) => ({ ...d, [key]: items }))} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
