export function Skeleton({ className = '', style }) {
  return <div style={style} className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />;
}

// Matches ProjectsList's real card: title + status badge, two description
// lines, a progress bar, and a manager/due-date footer row.
export function SkeletonCardGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// Mirrors the real Kanban board's shape (a toolbar row, then N columns each
// with a header and a handful of card-shaped placeholders) so the loading
// state doesn't visually jump once real data arrives.
export function SkeletonKanban({ columns = 4, cardsPerColumn = 3 }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: columns }).map((_, col) => (
          <div key={col} className="flex w-72 flex-none flex-col gap-2 rounded-xl bg-slate-100/70 p-2 dark:bg-slate-800/60">
            <div className="flex items-center justify-between px-1 py-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            {Array.from({ length: cardsPerColumn }).map((_, card) => (
              <div key={card} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3.5 w-3/5" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Row of stat-card-shaped placeholders (icon corner + label + value), same
// grid layout StatCard is actually rendered in.
export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-6 w-10" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// A chart-shaped placeholder — a title bar plus either a centered ring
// (pie/donut charts) or a row of bars of varying height (bar charts),
// inside a card matching the real chart's container.
export function SkeletonChart({ variant = 'pie', height = 220 }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <Skeleton className="mb-4 h-4 w-32" />
      {variant === 'pie' ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="h-32 w-32 animate-pulse rounded-full border-[14px] border-slate-200/80 dark:border-slate-700/80" />
        </div>
      ) : (
        <div className="flex items-end justify-between gap-2 px-2" style={{ height }}>
          {[45, 75, 35, 90, 55, 65].map((h, i) => (
            <Skeleton key={i} className="w-full rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
