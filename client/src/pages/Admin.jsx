import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Trash2 } from 'lucide-react';
import userService from '../services/userService';
import organizationService from '../services/organizationService';
import { getErrorMessage } from '../services/api';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import Select from '../components/common/Select';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { SkeletonRows } from '../components/common/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { ALL_ROLES } from '../utils/roles';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = async () => {
    try {
      const [userData, orgData] = await Promise.all([userService.list(), organizationService.list()]);
      setUsers(userData);
      setOrgs(orgData);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (id, role) => {
    try {
      const updated = await userService.updateRole(id, role);
      setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleStatusToggle = async (u) => {
    try {
      const updated = await userService.updateStatus(u._id, !u.isActive);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? updated : x)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await userService.remove(pendingDelete._id);
      setUsers((prev) => prev.filter((u) => u._id !== pendingDelete._id));
      setPendingDelete(null);
      toast.success('User removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <SkeletonRows count={6} />;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-900">Organizations</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Card key={org._id} className="p-4">
              <p className="font-medium text-slate-800">{org.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {org.memberCount} members · {org.projectCount} projects
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">User Accounts</h3>
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={u.role} onChange={(role) => handleRoleChange(u._id, role)} options={ALL_ROLES} className="text-xs" />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(u)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {String(u._id) !== String(currentUser._id) && (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(u)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Remove user?"
        description={`This will permanently delete ${pendingDelete?.name}'s account.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
