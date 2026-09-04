import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import authService from '../services/authService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await authService.updateProfile({ name });
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await authService.changePassword(passwords);
      toast.success('Password updated');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Card className="flex items-center gap-4 p-5">
        <Avatar name={user.name} size="lg" />
        <div>
          <p className="font-semibold text-slate-900">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <Badge value={user.role} variant="status" className="mt-1.5" />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold text-slate-900">Edit Profile</h3>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </form>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Current password</label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="secondary" loading={changingPassword}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
