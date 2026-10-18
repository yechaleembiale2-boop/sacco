'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language-context';
import { can } from '@/lib/permissions';

export function Nav() {
  const { user, logout } = useAuth();
  const { lang, t, toggleLang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const showApprovals = can(user?.role, 'approve_loan');
  const showMembers = can(user?.role, 'create_member');
  const showReports = can(user?.role, 'view_reports');
  const isAuditor = user?.role === 'auditor';

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        {/* Left: Logo + Links */}
        <div className="flex items-center gap-8 flex-wrap">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg text-slate-900 hover:text-blue-700 transition"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-sm shadow-md">
              IU
            </div>
            <span>SACCO</span>
          </Link>

          {user && (
            <div className="flex items-center gap-1 text-sm">
              <NavLink href="/dashboard" active={isActive('/dashboard')}>
                {t('nav_dashboard')}
              </NavLink>
              <NavLink href="/statements" active={isActive('/statements')}>
                {t('nav_statements')}
              </NavLink>
              {can(user.role, 'apply_loan') && (
                <NavLink href="/apply" active={isActive('/apply')}>
                  {t('nav_apply')}
                </NavLink>
              )}
              {showApprovals && (
                <NavLink href="/pending" active={isActive('/pending')}>
                  Approvals
                </NavLink>
              )}
              {showMembers && (
                <NavLink href="/admin/members" active={isActive('/admin/members')}>
                  Members
                </NavLink>
              )}
              {showReports && (
                <NavLink href="/reports" active={isActive('/reports')}>
                  Reports
                </NavLink>
              )}
            </div>
          )}
        </div>

        {/* Right: Lang + User + Logout */}
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition font-medium text-slate-700"
          >
            {lang === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}
          </button>

          {user && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <div className="text-slate-900 font-medium leading-tight text-xs">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight capitalize flex items-center gap-1">
                    {user.role.replace('_', ' ')}
                    {isAuditor && (
                      <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[9px] font-medium">
                        read-only
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-700 transition text-slate-700 font-medium"
              >
                {t('nav_logout')}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`nav-link px-3 py-2 rounded-lg font-medium transition ${
        active
          ? 'text-blue-700 bg-blue-50'
          : 'text-slate-700 hover:text-blue-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </Link>
  );
}