import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from '../common/CommandPalette';
import QuickAddTaskModal from '../tasks/QuickAddTaskModal';

const TITLES = [
  { match: /^\/dashboard/, title: 'Dashboard' },
  { match: /^\/projects/, title: 'Projects' },
  { match: /^\/tasks/, title: 'Tasks' },
  { match: /^\/bugs/, title: 'Bug Tracker' },
  { match: /^\/ai-assistant/, title: 'AI Assistant' },
  { match: /^\/team/, title: 'Team' },
  { match: /^\/analytics/, title: 'Analytics' },
  { match: /^\/notifications/, title: 'Notifications' },
  { match: /^\/settings/, title: 'Settings' },
  { match: /^\/profile/, title: 'Profile' },
  { match: /^\/admin/, title: 'Admin' },
];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = TITLES.find((t) => t.match.test(location.pathname))?.title || 'DevPilot AI';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette />
      <QuickAddTaskModal />
    </div>
  );
}
