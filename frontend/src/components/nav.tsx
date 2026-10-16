'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="font-semibold text-lg">
        IU SACCO
      </Link>
      {user && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {user.username} · <span className="text-gray-400">{user.role}</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 transition"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}
