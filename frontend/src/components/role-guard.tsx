'use client';

import { useAuth } from '@/lib/auth';
import { can, type Capability } from '@/lib/permissions';

interface RoleGuardProps {
  capability: Capability;
  children: React.ReactNode;
  silent?: boolean;
}

export function RoleGuard({
  capability,
  children,
  silent = false,
}: RoleGuardProps) {
  const { user, loading } = useAuth();

  // While auth is still loading, show nothing
  if (loading) {
    return (
      <div className="text-gray-600 text-center py-12">Loading…</div>
    );
  }

  if (!can(user?.role, capability)) {
    if (silent) return null;
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
        <p className="text-lg font-semibold mb-2">Access Denied</p>
        <p className="text-sm">
          Your role (<span className="font-medium">{user?.role ?? 'guest'}</span>) 
          does not have permission to view this page.
        </p>
        <p className="text-xs text-red-600 mt-2">
          Required: {capability}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}