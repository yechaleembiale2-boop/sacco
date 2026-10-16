'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language-context';
import { can } from '@/lib/permissions';

export function Nav() {
  const { user, logout } = useAuth();
  const { lang, t, toggleLang } = useLanguage();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const showApprovals = can(user?.role, 'approve_loan');
  const showMembers = can(user?.role, 'create_member');
  const showReports = can(user?.role, 'view_reports');
  const isAuditor = user?.role === 'auditor';

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-6 flex-wrap">
        <Link href="/dashboard" className="font-semibold text-lg text-gray-900">
          IU SACCO
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {t('nav_dashboard')}
            </Link>
            <Link
              href="/statements"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {t('nav_statements')}
            </Link>
            <Link
              href="/apply"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {t('nav_apply')}
            </Link>

            {showApprovals && (
              <Link
                href="/pending"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Approvals
              </Link>
            )}

            {showMembers && (
              <Link
                href="/admin/members"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Members
              </Link>
            )}

            {showReports && (
              <Link
                href="/reports"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Reports
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={toggleLang}
          className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition font-medium text-gray-900"
        >
          {lang === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}
        </button>

        {user && (
          <>
            <div className="text-right">
              <div className="text-gray-900 font-medium leading-tight">
                {user.username}
              </div>
              <div className="text-xs text-gray-500 leading-tight">
                {user.role}
                {isAuditor && (
                  <span className="ml-1 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    read-only
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 transition text-gray-900"
            >
              {t('nav_logout')}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}