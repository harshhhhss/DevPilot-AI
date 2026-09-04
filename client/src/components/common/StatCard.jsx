export default function StatCard({ icon: Icon, label, value, hint, accent = 'text-brand-600 bg-brand-50' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${accent}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
