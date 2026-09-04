import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, LogOut, User as UserIcon, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import NotificationBell from './NotificationBell';
import ThemeToggle from '../common/ThemeToggle';

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('devpilot:open-command-palette'))}
          className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-300 hover:text-slate-600 sm:flex"
        >
          <Search size={13} />
          Jump to...
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        <ThemeToggle />
        <NotificationBell />

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
          >
            <Avatar name={user?.name} size="sm" />
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">{user?.name}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.role}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <UserIcon size={15} />
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
