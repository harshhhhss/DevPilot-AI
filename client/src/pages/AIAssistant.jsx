import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, FileText, MessagesSquare, Info } from 'lucide-react';
import aiService from '../services/aiService';
import projectService from '../services/projectService';
import { getErrorMessage } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import AIBadge from '../components/common/AIBadge';
import RoleGate from '../components/common/RoleGate';
import TypewriterText from '../components/common/TypewriterText';
import { aiToast } from '../utils/aiToast';
import { MANAGING_ROLES } from '../utils/roles';

const TABS = [
  { id: 'user-story', label: 'User Story Generator', icon: FileText },
  { id: 'meeting', label: 'Meeting Summarizer', icon: MessagesSquare },
];

function UserStoryTool({ projectId }) {
  const [featureDescription, setFeatureDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!featureDescription.trim()) return;
    setLoading(true);
    try {
      const { data } = await aiService.generateUserStory({ projectId: projectId || undefined, featureDescription });
      setResult(data);
      aiToast('User story drafted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Feature description</label>
        <textarea
          rows={3}
          value={featureDescription}
          onChange={(e) => setFeatureDescription(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Users should be able to reset their password."
        />
      </div>
      <Button onClick={generate} loading={loading} disabled={!featureDescription.trim()}>
        <Sparkles size={14} />
        Generate User Story
      </Button>

      {result && (
        <div className="space-y-3 rounded-lg border border-violet-100 bg-violet-50/40 p-4">
          <AIBadge label="AI-generated draft — review and edit before saving" />
          <p className="text-sm font-medium text-slate-800">
            <TypewriterText text={result.userStory} />
          </p>
          {result.acceptanceCriteria?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600">Acceptance criteria</p>
              <ul className="list-inside list-disc text-sm text-slate-600">
                {result.acceptanceCriteria.map((ac, i) => (
                  <li key={i}>{ac}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-slate-600">
            Suggested priority: <strong>{result.suggestedPriority}</strong>
          </p>
          {result.suggestedTasks?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600">Suggested tasks</p>
              <ul className="list-inside list-disc text-sm text-slate-600">
                {result.suggestedTasks.map((t, i) => (
                  <li key={i}>{t.title}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <Info size={12} /> Open a project's Sprints tab to save this as a real task once you're happy with it.
          </p>
        </div>
      )}
    </div>
  );
}

function MeetingTool({ projectId }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      const { data } = await aiService.summarizeMeeting({ projectId: projectId || undefined, notes });
      setResult(data);
      aiToast('Meeting summarized');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Meeting notes / transcript</label>
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <Button onClick={generate} loading={loading} disabled={!notes.trim()}>
        <Sparkles size={14} />
        Summarize with AI
      </Button>

      {result && (
        <div className="space-y-3 rounded-lg border border-violet-100 bg-violet-50/40 p-4">
          <AIBadge label="AI-generated draft — review and edit before saving" />
          <p className="text-sm text-slate-700">
            <TypewriterText text={result.summary} />
          </p>
          {result.actionItems?.length > 0 && (
            <ul className="list-inside list-disc text-sm text-slate-600">
              {result.actionItems.map((item, i) => (
                <li key={i}>
                  {item.description}
                  {item.assigneeName && <span className="text-slate-400"> — {item.assigneeName}</span>}
                  {item.deadline && <span className="text-slate-400"> (due {item.deadline})</span>}
                </li>
              ))}
            </ul>
          )}
          {projectId && (
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Info size={12} /> Open the project's AI Meetings tab to save this permanently and convert action items into tasks.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIAssistant() {
  const [tab, setTab] = useState('user-story');
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    projectService.list().then(setProjects).catch(() => {});
  }, []);

  return (
    <RoleGate
      roles={[...MANAGING_ROLES, 'Developer', 'Tester', 'Stakeholder']}
      fallback={<p className="text-sm text-slate-500">You don&apos;t have access to the AI Assistant.</p>}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
          <Select
            value={projectId}
            onChange={setProjectId}
            options={projects.map((p) => ({ value: p._id, label: p.name }))}
            placeholder="No project context"
          />
        </div>

        <Card className="p-5">{tab === 'user-story' ? <UserStoryTool projectId={projectId} /> : <MeetingTool projectId={projectId} />}</Card>

        <p className="text-xs text-slate-400">
          For the AI Sprint Planner, AI Bug Analyzer, and AI Risk Analysis, open a specific project's Sprints, Bugs, or
          Overview tab — those tools work directly against that project's data.
        </p>
      </div>
    </RoleGate>
  );
}
