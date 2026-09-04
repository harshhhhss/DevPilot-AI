import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, X } from 'lucide-react';
import projectService from '../../services/projectService';
import userService from '../../services/userService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import RoleGate from '../../components/common/RoleGate';
import { MANAGING_ROLES } from '../../utils/roles';

function AddMemberModal({ open, onClose, projectId, existingIds, onAdded }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) userService.list().then(setUsers).catch(() => {});
  }, [open]);

  const available = users.filter((u) => !existingIds.includes(u._id));

  const submit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const project = await projectService.addMember(projectId, selected);
      toast.success('Member added');
      onAdded(project);
      setSelected('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Team Member"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading} disabled={!selected}>
            Add Member
          </Button>
        </>
      }
    >
      <Select
        value={selected}
        onChange={setSelected}
        options={available.map((u) => ({ value: u._id, label: `${u.name} (${u.role})` }))}
        placeholder="Select a user"
        className="w-full"
      />
    </Modal>
  );
}

export default function ProjectTeam() {
  const { project, reload } = useOutletContext();
  const [showAdd, setShowAdd] = useState(false);

  const handleRemove = async (userId) => {
    try {
      await projectService.removeMember(project._id, userId);
      toast.success('Member removed');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const existingIds = [project.manager?._id, ...project.members.map((m) => m._id)];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RoleGate roles={MANAGING_ROLES}>
          <Button onClick={() => setShowAdd(true)}>
            <UserPlus size={15} />
            Add Member
          </Button>
        </RoleGate>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <Avatar name={project.manager?.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{project.manager?.name}</p>
            <p className="text-xs text-slate-500">Project Manager · {project.manager?.email}</p>
          </div>
        </Card>

        {project.members.map((member) => (
          <Card key={member._id} className="flex items-center gap-3 p-4">
            <Avatar name={member.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{member.name}</p>
              <p className="text-xs text-slate-500">
                {member.role} · {member.email}
              </p>
            </div>
            <RoleGate roles={MANAGING_ROLES}>
              <button
                type="button"
                onClick={() => handleRemove(member._id)}
                className="flex-none rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <X size={15} />
              </button>
            </RoleGate>
          </Card>
        ))}
      </div>

      <AddMemberModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        projectId={project._id}
        existingIds={existingIds}
        onAdded={() => {
          reload();
          setShowAdd(false);
        }}
      />
    </div>
  );
}
