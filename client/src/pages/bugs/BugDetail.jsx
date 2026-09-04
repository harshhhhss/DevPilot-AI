import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import bugService from '../../services/bugService';
import projectService from '../../services/projectService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import { Skeleton } from '../../components/common/Skeleton';
import BugDetailPanel from '../../components/bugs/BugDetailPanel';

export default function BugDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bug, setBug] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    bugService
      .get(id)
      .then(async (b) => {
        setBug(b);
        const p = await projectService.get(b.project);
        setProject(p);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!bug) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} />
        Back
      </button>
      <Card className="p-6">
        <BugDetailPanel bug={bug} onUpdate={setBug} assignableUsers={project ? [project.manager, ...project.members] : []} />
      </Card>
    </div>
  );
}
