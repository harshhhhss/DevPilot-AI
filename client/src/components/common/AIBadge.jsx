import { Sparkles } from 'lucide-react';

// Two tones carry distinct meaning, not just decoration:
// - "advisory" (violet): a read-only AI annotation already attached to real
//   data (risk score, bug diagnosis, priority suggestion) — informational.
// - "draft" (amber): AI-generated content that is NOT yet saved anywhere and
//   is waiting on an explicit human review/confirm step (sprint plan, quick
//   task, meeting summary, retrospective) — needs attention, not just FYI.
const TONES = {
  advisory: 'border-violet-200 bg-violet-50 text-violet-700',
  draft: 'border-amber-200 bg-amber-50 text-amber-800',
};

export default function AIBadge({ label = 'AI Recommendation', tone = 'advisory', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONES[tone] || TONES.advisory} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {tone === 'draft' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${tone === 'draft' ? 'bg-amber-500' : 'bg-violet-500'}`} />
      </span>
      <Sparkles size={11} />
      {label}
    </span>
  );
}
