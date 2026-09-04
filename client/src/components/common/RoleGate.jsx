import { useAuth } from '../../hooks/useAuth';

export default function RoleGate({ roles, children, fallback = null }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return fallback;
  return children;
}
