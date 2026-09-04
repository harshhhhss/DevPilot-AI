import { titleCase } from '../../utils/format';

export default function Select({ value, onChange, options, placeholder, className = '', ...rest }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${className}`}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => {
        const optValue = typeof opt === 'string' ? opt : opt.value;
        const optLabel = typeof opt === 'string' ? titleCase(opt) : opt.label;
        return (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        );
      })}
    </select>
  );
}
