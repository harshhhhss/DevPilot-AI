import { Sparkles, AlertTriangle } from 'lucide-react';

// A single, considered "the AI is working" state reused everywhere a Gemini
// call is in flight, instead of each modal inventing its own spinner+text.
// The pulsing sparkle (not a generic Loader2 spin) is what makes this read
// as "AI thinking" rather than "page loading."
export function AIThinking({ label = 'Thinking with Gemini...' }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-violet-100 bg-violet-50/50 px-3.5 py-3 dark:border-violet-900/40">
      <span className="relative flex h-5 w-5 flex-none items-center justify-center">
        <span className="absolute h-full w-full animate-ping rounded-full bg-violet-400 opacity-40" />
        <Sparkles size={14} className="relative text-violet-600" />
      </span>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

// CON-04's "falls back to manual entry" guarantee needs to actually be
// legible in the UI, not just a toast that vanishes — this inline banner
// stays in the modal, names what happened, and tells the user they can keep
// going by hand instead of waiting on the AI.
export function AIErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 dark:border-rose-900/40">
      <AlertTriangle size={15} className="mt-0.5 flex-none text-rose-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-rose-700">Gemini did not respond</p>
        <p className="mt-0.5 text-xs text-rose-600">
          {message || 'The AI request failed.'} You can keep filling this in by hand, or try again.
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex-none text-xs font-semibold text-rose-700 underline hover:text-rose-800"
        >
          Retry
        </button>
      )}
    </div>
  );
}
