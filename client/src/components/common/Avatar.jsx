import { initials } from '../../utils/format';

const SIZES = { sm: 'h-6 w-6 text-xs', md: 'h-8 w-8 text-xs', lg: 'h-11 w-11 text-sm' };

const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

const colorFor = (name) => {
  const code = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLORS[code % COLORS.length];
};

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <span
      title={name}
      className={`inline-flex flex-none items-center justify-center rounded-full font-semibold ${SIZES[size]} ${colorFor(name)} ${className}`}
    >
      {initials(name) || '?'}
    </span>
  );
}
