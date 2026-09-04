import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';
import TaskDetailPanel from '../../components/tasks/TaskDetailPanel';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    taskService
      .get(id)
      .then(async (t) => {
        setTask(t);
        const p = await projectService.get(t.project);
        setProject(p);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try {
      await taskService.remove(id);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!task) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} />
        Back
      </button>
      <Card className="p-6">
        <TaskDetailPanel
          task={task}
          onUpdate={setTask}
          onDelete={() => setConfirmDelete(true)}
          assignableUsers={project ? [project.manager, ...project.members] : []}
        />
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete task?"
        description="This will permanently remove the task and its comments."
        confirmLabel="Delete"
      />
    </div>
  );
}
