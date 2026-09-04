import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Bug,
  Sparkles,
  Users,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/roles';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/bugs', label: 'Bugs', icon: Bug },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-none flex-col gap-6 border-r border-slate-200 bg-white px-4 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
          D
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-slate-900">DevPilot AI</p>
          <p className="text-xs text-slate-500">Project OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        {user?.role === ROLES.ADMIN && (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <ShieldCheck size={17} />
            Admin
          </NavLink>
        )}
      </nav>

      <NavLink
        to="/settings"
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`
        }
      >
        <Settings size={17} />
        Settings
      </NavLink>
    </aside>
  );
}
