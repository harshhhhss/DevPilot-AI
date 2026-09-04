import { Sparkles } from 'lucide-react';

export default function AIBadge({ label = 'AI Recommendation', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ${className}`}
    >
      <Sparkles size={11} />
      {label}
    </span>
  );
}
