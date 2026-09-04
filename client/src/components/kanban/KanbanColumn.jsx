import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import { TASK_STATUS_LABELS } from '../../utils/constants';

export default function KanbanColumn({ status, tasks, onTaskClick, canDragTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 flex-none flex-col rounded-xl bg-slate-100/70">
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-sm font-semibold text-slate-700">{TASK_STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-b-xl p-2 transition-colors ${
          isOver ? 'bg-brand-50' : ''
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} onClick={onTaskClick} canDrag={canDragTask ? canDragTask(task) : true} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
