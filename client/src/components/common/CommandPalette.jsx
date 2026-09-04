import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Bug,
  Sparkles,
  Users,
  BarChart3,
  Bell,
  Settings,
  UserCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/roles';

const BASE_COMMANDS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/bugs', label: 'Bugs', icon: Bug },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

// Global Cmd/Ctrl+K quick navigation. Purely additive — doesn't change any
// existing route, permission, or page behavior, just a faster way to jump.
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const commands = useMemo(() => {
    const list = [...BASE_COMMANDS];
    if (user?.role === ROLES.ADMIN) {
      list.push({ to: '/admin', label: 'Admin', icon: ShieldCheck });
    }
    return list;
  }, [user]);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const handleOpenEvent = () => setOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('devpilot:open-command-palette', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('devpilot:open-command-palette', handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const go = (to) => {
    navigate(to);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <Search size={16} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to..."
                className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
                Esc
              </kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {filtered.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-400">No matches</p>}
              {filtered.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => go(to)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
