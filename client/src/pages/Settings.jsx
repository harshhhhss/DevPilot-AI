import { Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function Settings() {
  const { user } = useAuth();
  const { mode, setMode } = useTheme();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Card className="space-y-3 p-5">
        <h3 className="text-sm font-semibold text-slate-900">Appearance</h3>
        <p className="text-sm text-slate-500">Choose how DevPilot AI looks on this device.</p>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors ${
                mode === value
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="text-sm font-semibold text-slate-900">Account</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Name</span>
          <span className="font-medium text-slate-800">{user.name}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Email</span>
          <span className="font-medium text-slate-800">{user.email}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Role</span>
          <Badge value={user.role} variant="status" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Organization</span>
          <span className="font-medium text-slate-800">{user.organization?.name || 'Not set'}</span>
        </div>
      </Card>

      <Card className="space-y-2 p-5">
        <h3 className="text-sm font-semibold text-slate-900">About DevPilot AI</h3>
        <p className="text-sm text-slate-500">
          DevPilot AI is an intelligent software project management platform combining sprint planning, Kanban task
          tracking, bug management, and AI-assisted planning powered by Google Gemini. AI-generated content is always
          presented as an editable draft and never saved without your explicit review.
        </p>
      </Card>
    </div>
  );
}
