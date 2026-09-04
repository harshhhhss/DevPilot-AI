import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center">
      <p className="text-6xl font-bold text-slate-200">404</p>
      <p className="text-lg font-semibold text-slate-800">Page not found</p>
      <p className="max-w-sm text-sm text-slate-500">The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Link to="/dashboard">
        <Button className="mt-2">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
