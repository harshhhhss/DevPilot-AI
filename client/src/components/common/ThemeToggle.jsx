import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const ORDER = ['light', 'dark', 'system'];
const ICONS = { light: Sun, dark: Moon, system: Monitor };
const LABELS = { light: 'Light theme', dark: 'Dark theme', system: 'Match system theme' };

// Quick-access cycle button for the topbar. The full three-way picker lives
// in Settings > Appearance for anyone who wants to choose explicitly.
export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const Icon = ICONS[mode];

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      title={`${LABELS[mode]} — click to change`}
      className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
    >
      <Icon size={17} />
    </button>
  );
}
