import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ListChecks } from 'lucide-react';
import taskService from '../../services/taskService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Select from '../../components/common/Select';
import SearchInput from '../../components/common/SearchInput';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRows } from '../../components/common/Skeleton';
import { TASK_STATUSES, PRIORITIES } from '../../utils/constants';
import { formatDate } from '../../utils/format';

export default function TasksList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      taskService
        .list({ search: search || undefined, status: status || undefined, priority: priority || undefined })
        .then(setTasks)
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, status, priority]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." className="w-64" />
        <Select value={status} onChange={setStatus} options={TASK_STATUSES} placeholder="All statuses" />
        <Select value={priority} onChange={setPriority} options={PRIORITIES} placeholder="All priorities" />
      </div>

      {loading ? (
        <SkeletonRows count={6} />
      ) : tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks found" description="Tasks assigned to you across projects will appear here." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Task</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Assignee</th>
                <th className="px-4 py-2.5">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task._id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/tasks/${task._id}`)}>
                  <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-800">{task.title}</td>
                  <td className="px-4 py-3">
                    <Badge value={task.status} variant="status" />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={task.priority} variant="priority" />
                  </td>
                  <td className="px-4 py-3">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={task.assignee.name} size="sm" />
                        {task.assignee.name}
                      </div>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(task.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
