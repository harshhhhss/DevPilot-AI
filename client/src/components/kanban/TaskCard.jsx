import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Sparkles, CalendarClock } from 'lucide-react';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/format';

export default function TaskCard({ task, onClick, canDrag = true }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    disabled: !canDrag,
  });

  const style = {
    transform: transform
      ? `${CSS.Translate.toString(transform)} ${isDragging ? 'scale(1.04) rotate(-1deg)' : ''}`
      : undefined,
    opacity: isDragging ? 0.85 : 1,
    transition: isDragging ? undefined : 'box-shadow 150ms ease, transform 150ms ease',
  };

  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(task)}
      title={canDrag ? undefined : "You can't move this card — you're not the assignee, manager, or admin"}
      className={`space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:-translate-y-0.5 hover:shadow-md ${
        isDragging ? 'shadow-xl ring-2 ring-brand-300' : ''
      } ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-slate-800">{task.title}</p>
        {task.aiGenerated && <Sparkles size={13} className="mt-0.5 flex-none text-violet-500" />}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge value={task.priority} variant="priority" />
        {task.storyPoints > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {task.storyPoints} pts
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {task.dueDate ? (
          <span className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-rose-600' : 'text-slate-400'}`}>
            <CalendarClock size={11} />
            {formatDate(task.dueDate)}
          </span>
        ) : (
          <span />
        )}
        {task.assignee ? (
          <Avatar name={task.assignee.name} size="sm" />
        ) : (
          <span className="text-[11px] text-slate-400">Unassigned</span>
        )}
      </div>
    </div>
  );
}
