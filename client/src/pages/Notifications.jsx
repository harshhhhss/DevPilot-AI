import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Trash2 } from 'lucide-react';
import notificationService from '../services/notificationService';
import { getErrorMessage } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { SkeletonRows } from '../components/common/Skeleton';
import { formatRelativeTime } from '../utils/format';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    notificationService
      .list()
      .then((res) => setItems(res.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleMarkRead = async (id) => {
    await notificationService.markAsRead(id);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  const handleDelete = async (id) => {
    await notificationService.remove(id);
    setItems((prev) => prev.filter((n) => n._id !== id));
  };

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <SkeletonRows count={6} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={handleMarkAll}>
          Mark all as read
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="New notifications will show up here." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card
              key={n._id}
              className={`flex items-center justify-between gap-3 p-4 ${n.read ? '' : 'border-brand-200 bg-brand-50/40'}`}
              onClick={() => !n.read && handleMarkRead(n._id)}
            >
              <div className="min-w-0 cursor-pointer">
                <p className="text-sm text-slate-700">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(n.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(n._id);
                }}
                className="flex-none rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
