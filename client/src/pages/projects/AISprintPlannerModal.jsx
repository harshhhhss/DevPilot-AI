import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Trash2, Loader2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import AIBadge from '../../components/common/AIBadge';
import aiService from '../../services/aiService';
import sprintService from '../../services/sprintService';
import taskService from '../../services/taskService';
import { getErrorMessage } from '../../services/api';
import { aiToast } from '../../utils/aiToast';
import { PRIORITIES } from '../../utils/constants';

const emptyDraft = () => ({
  sprintName: '',
  startDate: '',
  endDate: '',
  stories: [],
});

export default function AISprintPlannerModal({ open, onClose, project, onCreated }) {
  const [step, setStep] = useState('input');
  const [goal, setGoal] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  const reset = () => {
    setStep('input');
    setGoal('');
    setTeamSize('');
    setDraft(emptyDraft());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setGenerating(true);
    try {
      const { data } = await aiService.generateSprintPlan({ projectId: project._id, sprintGoal: goal, teamSize });
      setDraft({
        sprintName: data.sprintSummary?.slice(0, 60) || 'AI-Planned Sprint',
        startDate: '',
        endDate: '',
        stories: data.stories.map((s) => ({ ...s, acceptanceCriteria: s.acceptanceCriteria || [], tasks: s.tasks || [] })),
      });
      setStep('review');
      aiToast(`Drafted ${data.stories.length} stories — review before saving`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const updateStory = (index, patch) => {
    setDraft((d) => ({ ...d, stories: d.stories.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));
  };

  const removeStory = (index) => {
    setDraft((d) => ({ ...d, stories: d.stories.filter((_, i) => i !== index) }));
  };

  const handleAccept = async () => {
    if (!draft.sprintName || !draft.startDate || !draft.endDate) {
      toast.error('Please provide a sprint name, start date, and end date');
      return;
    }
    if (draft.stories.length === 0) {
      toast.error('Add at least one story before creating the sprint');
      return;
    }

    setSaving(true);
    try {
      const sprint = await sprintService.create(project._id, {
        name: draft.sprintName,
        goal,
        startDate: draft.startDate,
        endDate: draft.endDate,
      });

      await Promise.all(
        draft.stories.map((story) =>
          taskService.create(project._id, {
            title: story.title,
            description: [story.userStory, story.tasks?.length ? `\nSuggested subtasks:\n${story.tasks.map((t) => `- ${t.title}`).join('\n')}` : '']
              .filter(Boolean)
              .join('\n'),
            acceptanceCriteria: story.acceptanceCriteria,
            priority: story.priority,
            storyPoints: story.storyPoints,
            sprint: sprint._id,
            aiGenerated: true,
          })
        )
      );

      aiToast(`Sprint "${sprint.name}" created with ${draft.stories.length} AI-drafted stories`);
      onCreated();
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-600" />
          AI Sprint Planner
        </span>
      }
      size="xl"
      footer={
        step === 'review' && (
          <>
            <Button variant="secondary" onClick={() => setStep('input')}>
              Back
            </Button>
            <Button onClick={handleAccept} loading={saving}>
              Create Sprint &amp; {draft.stories.length} Task{draft.stories.length === 1 ? '' : 's'}
            </Button>
          </>
        )
      }
    >
      {step === 'input' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Describe the sprint goal in plain language. AI will draft a structured backlog of user stories, acceptance
            criteria, priorities, and story points for you to review and edit before anything is saved.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sprint goal</label>
            <textarea
              rows={4}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Build an authentication system for an e-commerce application."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Team size (optional)</label>
            <input
              type="number"
              min={1}
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="4"
            />
          </div>
          <Button onClick={handleGenerate} loading={generating} disabled={!goal.trim()}>
            <Sparkles size={15} />
            Generate Sprint Plan
          </Button>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-5">
          <AIBadge label="AI-generated draft — review and edit before saving" />

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-700">Sprint name</label>
              <input
                value={draft.sprintName}
                onChange={(e) => setDraft((d) => ({ ...d, sprintName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Start date</label>
              <input
                type="date"
                value={draft.startDate}
                onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">End date</label>
              <input
                type="date"
                value={draft.endDate}
                onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {draft.stories.map((story, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <input
                    value={story.title}
                    onChange={(e) => updateStory(index, { title: e.target.value })}
                    className="w-full flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-800 hover:border-slate-200 focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeStory(index)}
                    className="flex-none rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={story.userStory}
                  onChange={(e) => updateStory(index, { userStory: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-brand-500 focus:outline-none"
                />

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Select
                    value={story.priority}
                    onChange={(v) => updateStory(index, { priority: v })}
                    options={PRIORITIES}
                    className="!py-1 text-xs"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    Story points
                    <input
                      type="number"
                      min={0}
                      value={story.storyPoints}
                      onChange={(e) => updateStory(index, { storyPoints: Number(e.target.value) })}
                      className="w-14 rounded-md border border-slate-300 px-1.5 py-1 text-xs"
                    />
                  </div>
                  {story.tasks?.length > 0 && <span className="text-xs text-slate-400">{story.tasks.length} suggested subtasks</span>}
                </div>

                {story.acceptanceCriteria?.length > 0 && (
                  <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-slate-500">
                    {story.acceptanceCriteria.map((ac, i) => (
                      <li key={i}>{ac}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {draft.stories.length === 0 && <p className="text-sm text-slate-400">All stories removed. Go back to regenerate.</p>}
          </div>
        </div>
      )}

      {generating && step === 'input' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Generating structured backlog with Gemini...
        </div>
      )}
    </Modal>
  );
}
