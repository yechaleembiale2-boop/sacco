'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language-context';

export function Nav() {
  const { user, logout } = useAuth();
  const { lang, t, toggleLang } = useLanguage();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="font-semibold text-lg text-gray-900">
          IU SACCO
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
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
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={toggleLang}
          className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition font-medium text-gray-900"
          title={lang === 'en' ? 'Switch to Amharic' : 'Switch to English'}
        >
          {lang === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}
        </button>
        {user && (
          <>
            <span className="text-gray-700">
              {user.username} · <span className="text-gray-500">{user.role}</span>
            </span>
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