import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-xl space-y-5">
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
          <span className="font-medium text-slate-800">{user.organization?.name || '—'}</span>
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
