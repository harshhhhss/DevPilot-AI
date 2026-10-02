import { Plus, Trash2 } from 'lucide-react';

// A simple list of free-text points a user can edit, remove, or add to —
// used for AI-drafted lists (retrospective sections, meeting key decisions)
// that need to be a real editable interface rather than a read-only <ul>.
export default function EditableList({ items, onChange, addLabel = 'Add point', emptyLabel = 'Nothing here yet.' }) {
  const update = (i, value) => onChange(items.map((v, idx) => (idx === i ? value : v)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, '']);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <textarea
            rows={1}
            value={item}
            onChange={(e) => update(i, e.target.value)}
            className="w-full flex-1 resize-none rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-1 flex-none rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
        <Plus size={12} /> {addLabel}
      </button>
      {items.length === 0 && <p className="text-xs text-slate-400">{emptyLabel}</p>}
    </div>
  );
}
