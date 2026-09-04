import { DndContext, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import { TASK_STATUSES } from '../../utils/constants';

export default function KanbanBoard({ tasks, onTaskClick, onStatusChange }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find((t) => t._id === active.id);
    const newStatus = over.id;

    if (task && task.status !== newStatus && TASK_STATUSES.includes(newStatus)) {
      onStatusChange(task, newStatus);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DndContext>
  );
}
