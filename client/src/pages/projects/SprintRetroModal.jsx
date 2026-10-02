import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import AIBadge from '../../components/common/AIBadge';
import EditableList from '../../components/common/EditableList';
import { AIThinking, AIErrorBanner } from '../../components/common/AIStatus';
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

export default function SprintRetroModal({ open, onClose, project, sprint, onSaved }) {
  const [draft, setDraft] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState('');

  useEffect(() => {
    if (!open) return;
    const saved = sprint?.retrospective;
    setDraft(saved?.savedAt ? { wentWell: saved.wentWell, didntGoWell: saved.didntGoWell, improvements: saved.improvements } : null);
  }, [open, sprint]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const { data } = await aiService.generateSprintRetro(sprint._id);
      setDraft(data);
      aiToast('Retrospective drafted. Review before saving.');
    } catch (err) {
      setGenError(getErrorMessage(err));
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
          Sprint Retrospective: {sprint?.name}
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
          {genError && <AIErrorBanner message={genError} onRetry={handleGenerate} />}
        </div>
      )}

      {generating && <AIThinking label="Analyzing sprint data with Gemini..." />}

      {draft && !generating && (
        <div className="space-y-4">
          {genError && <AIErrorBanner message={genError} onRetry={handleGenerate} />}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AIBadge label="AI-generated draft. Review and edit before saving." tone="draft" />
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
