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
  Loader2,
  FolderPlus,
  ListPlus,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, MANAGING_ROLES } from '../../utils/roles';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import bugService from '../../services/bugService';

const NAV_COMMANDS = [
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

const RESULT_LIMIT = 5;

// Global Cmd/Ctrl+K quick navigation and search. Purely additive — search
// reuses the existing list endpoints' ?search= param (already supported by
// projects/tasks/bugs) rather than adding new backend routes, and actions
// dispatch to the same modals/flows the rest of the UI already uses.
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ projects: [], tasks: [], bugs: [] });
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isManaging = user?.role && MANAGING_ROLES.includes(user.role);

  const navCommands = useMemo(() => {
    const list = [...NAV_COMMANDS];
    if (user?.role === ROLES.ADMIN) {
      list.push({ to: '/admin', label: 'Admin', icon: ShieldCheck });
    }
    return list;
  }, [user]);

  const actionCommands = useMemo(() => {
    if (!isManaging) return [];
    return [
      {
        id: 'action-new-task',
        label: 'Create new task',
        icon: ListPlus,
        run: () => window.dispatchEvent(new CustomEvent('devpilot:quick-add-task')),
      },
      {
        id: 'action-new-project',
        label: 'Create new project',
        icon: FolderPlus,
        run: () => navigate('/projects?new=1'),
      },
    ];
  }, [isManaging, navigate]);

  const filteredNav = navCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));
  const filteredActions = actionCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

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
    if (!open) {
      setQuery('');
      setResults({ projects: [], tasks: [], bugs: [] });
    }
  }, [open]);

  // Live search across projects/tasks/bugs once the query is long enough to
  // be meaningful — same debounce interval used by the list pages' own search.
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults({ projects: [], tasks: [], bugs: [] });
      return undefined;
    }

    setSearching(true);
    const timeout = setTimeout(() => {
      Promise.all([
        projectService.list({ search: query }).catch(() => []),
        taskService.list({ search: query }).catch(() => []),
        bugService.list({ search: query }).catch(() => []),
      ])
        .then(([projects, tasks, bugs]) => {
          setResults({
            projects: projects.slice(0, RESULT_LIMIT),
            tasks: tasks.slice(0, RESULT_LIMIT),
            bugs: bugs.slice(0, RESULT_LIMIT),
          });
        })
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, open]);

  const go = (to) => {
    navigate(to);
    setOpen(false);
  };

  const runAction = (action) => {
    action.run();
    setOpen(false);
  };

  const isSearchMode = query.trim().length >= 2;
  const hasSearchResults = results.projects.length || results.tasks.length || results.bugs.length;

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
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              {searching ? (
                <Loader2 size={16} className="flex-none animate-spin text-slate-400" />
              ) : (
                <Search size={16} className="flex-none text-slate-400" />
              )}
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a page, project, task, bug, or action..."
                className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
                Esc
              </kbd>
            </div>

            <div className="max-h-96 overflow-y-auto p-1.5">
              {filteredActions.length > 0 && (
                <div className="mb-1">
                  <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Actions</p>
                  {filteredActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => runAction(action)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <action.icon size={15} />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {isSearchMode && hasSearchResults > 0 ? (
                <>
                  {results.projects.length > 0 && (
                    <div className="mb-1">
                      <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Projects</p>
                      {results.projects.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => go(`/projects/${p._id}`)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                        >
                          <FolderKanban size={15} className="flex-none" />
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.tasks.length > 0 && (
                    <div className="mb-1">
                      <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tasks</p>
                      {results.tasks.map((t) => (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => go(`/tasks/${t._id}`)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                        >
                          <ListChecks size={15} className="flex-none" />
                          <span className="truncate">{t.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.bugs.length > 0 && (
                    <div className="mb-1">
                      <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Bugs</p>
                      {results.bugs.map((b) => (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => go(`/bugs/${b._id}`)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                        >
                          <Bug size={15} className="flex-none" />
                          <span className="truncate">{b.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : isSearchMode && !searching ? (
                <p className="px-3 py-4 text-center text-sm text-slate-400">No matching projects, tasks, or bugs</p>
              ) : null}

              {!isSearchMode && (
                <div>
                  <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Go to</p>
                  {filteredNav.length === 0 && filteredActions.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-slate-400">No matches</p>
                  )}
                  {filteredNav.map(({ to, label, icon: Icon }) => (
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
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
