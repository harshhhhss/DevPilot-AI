import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bug as BugIcon } from 'lucide-react';
import bugService from '../../services/bugService';
import { getErrorMessage } from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import SearchInput from '../../components/common/SearchInput';
import EmptyState from '../../components/common/EmptyState';
import FadeIn from '../../components/common/FadeIn';
import { SkeletonRows } from '../../components/common/Skeleton';
import { BUG_STATUSES, BUG_SEVERITIES } from '../../utils/constants';
import { formatDate } from '../../utils/format';

export default function BugsList() {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      bugService
        .list({ search: search || undefined, status: status || undefined, severity: severity || undefined })
        .then(setBugs)
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, status, severity]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search bugs..." className="w-64" />
        <Select value={status} onChange={setStatus} options={BUG_STATUSES} placeholder="All statuses" />
        <Select value={severity} onChange={setSeverity} options={BUG_SEVERITIES} placeholder="All severities" />
      </div>

      {loading ? (
        <SkeletonRows count={6} />
      ) : bugs.length === 0 ? (
        <EmptyState icon={BugIcon} title="No bugs found" description="Bugs you reported or are assigned to will appear here." />
      ) : (
        <FadeIn className="space-y-2">
          {bugs.map((bug) => (
            <Card key={bug._id} className="cursor-pointer p-4 hover:shadow-md" onClick={() => navigate(`/bugs/${bug._id}`)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800">{bug.title}</p>
                  <p className="mt-1 text-xs text-slate-400">Reported {formatDate(bug.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={bug.severity} variant="priority" />
                  <Badge value={bug.status} variant="status" />
                </div>
              </div>
            </Card>
          ))}
        </FadeIn>
      )}
    </div>
  );
}
