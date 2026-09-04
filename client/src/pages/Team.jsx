import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import userService from '../services/userService';
import { getErrorMessage } from '../services/api';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import SearchInput from '../components/common/SearchInput';
import Select from '../components/common/Select';
import EmptyState from '../components/common/EmptyState';
import { SkeletonCardGrid } from '../components/common/Skeleton';
import { ALL_ROLES } from '../utils/roles';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      userService
        .list({ search: search || undefined, role: role || undefined })
        .then(setUsers)
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, role]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search team..." className="w-64" />
        <Select value={role} onChange={setRole} options={ALL_ROLES} placeholder="All roles" />
      </div>

      {loading ? (
        <SkeletonCardGrid />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No team members found" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <Card key={u._id} className="flex items-center gap-3 p-4">
              <Avatar name={u.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{u.name}</p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
                <Badge value={u.role} variant="status" className="mt-1.5" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
