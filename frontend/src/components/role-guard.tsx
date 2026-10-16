'use client';

import { useAuth } from '@/lib/auth';
import { can, type Capability } from '@/lib/permissions';

interface RoleGuardProps {
  capability: Capability;
  children: React.ReactNode;
  /** If true, render nothing instead of the "not authorized" message */
  silent?: boolean;
}

export function RoleGuard({
  capability,
  children,
  silent = false,
}: RoleGuardProps) {
  const { user } = useAuth();

  if (!can(user?.role, capability)) {
    if (silent) return null;
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
        You don&apos;t have permission for this action. Signed in as:{' '}
        <span className="font-medium">{user?.role ?? 'guest'}</span>.
      </div>
    );
  }

  return <>{children}</>;
}