import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Bug as BugIcon } from 'lucide-react';
import bugService from '../../services/bugService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { SkeletonRows } from '../../components/common/Skeleton';
import BugDetailPanel from '../../components/bugs/BugDetailPanel';
import BugFormModal from '../../components/bugs/BugFormModal';
import { formatDate } from '../../utils/format';

export default function ProjectBugs() {
  const { project } = useOutletContext();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      setBugs(await bugService.listForProject(project._id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  if (loading) return <SkeletonRows count={4} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          Report Bug
        </Button>
      </div>

      {bugs.length === 0 ? (
        <EmptyState icon={BugIcon} title="No bugs reported" description="Either this project is running clean, or nobody has logged one yet. Report the first if you've found something." />
      ) : (
        <div className="space-y-2">
          {bugs.map((bug) => (
            <Card key={bug._id} className="cursor-pointer p-4 hover:shadow-md" onClick={() => setSelected(bug)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800">{bug.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Reported by {bug.reporter?.name} on {formatDate(bug.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={bug.severity} variant="priority" />
                  <Badge value={bug.status} variant="status" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Bug Details" size="lg">
        {selected && (
          <BugDetailPanel
            bug={selected}
            onUpdate={(updated) => {
              setBugs((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
              setSelected(updated);
            }}
            assignableUsers={[project.manager, ...project.members]}
          />
        )}
      </Modal>

      <BugFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={project._id}
        onCreated={(bug) => {
          setBugs((prev) => [bug, ...prev]);
          setShowCreate(false);
        }}
      />
    </div>
  );
}
