import { STATUS_COLORS, PRIORITY_COLORS, RISK_COLORS } from '../../utils/constants';
import { titleCase } from '../../utils/format';

const PALETTES = { status: STATUS_COLORS, priority: PRIORITY_COLORS, risk: RISK_COLORS };

export default function Badge({ value, variant = 'status', className = '' }) {
  const palette = PALETTES[variant] || {};
  const colorClass = palette[value] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
    >
      {titleCase(value)}
    </span>
  );
}
