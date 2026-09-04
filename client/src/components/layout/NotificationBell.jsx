import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import { useSocket } from '../../hooks/useSocket';
import { formatRelativeTime } from '../../utils/format';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const { notifications } = useSocket();

  const load = async () => {
    try {
      const res = await notificationService.list();
      setItems(res.data);
      setUnreadCount(res.unreadCount);
    } catch {
      // best-effort; bell just stays empty
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (notifications.length === 0) return;
    setItems((prev) => [notifications[0], ...prev].slice(0, 20));
    setUnreadCount((c) => c + 1);
  }, [notifications]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = async () => {
    setOpen((o) => !o);
  };

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            <button type="button" onClick={handleMarkAll} className="text-xs font-medium text-brand-600 hover:underline">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet</p>}
            {items.slice(0, 8).map((n) => (
              <div key={n._id} className={`px-4 py-3 text-sm ${n.read ? 'bg-white' : 'bg-brand-50/40'}`}>
                <p className="text-slate-700">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-center">
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
