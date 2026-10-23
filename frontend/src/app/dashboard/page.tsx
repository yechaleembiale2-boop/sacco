'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language-context';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { can } from '@/lib/permissions';
import { Nav } from '@/components/nav';

interface SavingsAccount {
  id: string;
  memberId: string;
  accountType: string;
  balance: string;
  openedAt: string;
}

interface Loan {
  id: string;
  memberId: string;
  loanType: string;
  principal: string;
  status: string;
  totalPayable: string;
  outstandingBalance: string;
  termMonths: number;
}

interface ScheduleRow {
  installmentNo: number;
  dueDate: string;
  totalDue: string;
  paid: boolean;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();
  const userId = user?.id;
  const userRole = user?.role;
  const memberId = (user as { memberId?: string | null } | null)?.memberId;

  const [savings, setSavings] = useState<SavingsAccount[]>([]);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [nextInstallment, setNextInstallment] = useState<ScheduleRow | null>(
    null,
  );
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      try {
        // Try to fetch savings accounts
        // For members: filter by their linked memberId (if available)
        // For staff: show all accounts
        const accounts = await apiFetch<SavingsAccount[]>('/savings/accounts');
        if (cancelled) return;

        const isMember = userRole === 'member';
        let myAccounts = accounts;

        if (isMember) {
          // If user has a linked memberId, filter to that
          // Otherwise show all (fallback behavior)
          if (memberId) {
            const filtered = accounts.filter((a) => a.memberId === memberId);
            if (filtered.length > 0) myAccounts = filtered;
          }
        }

        setSavings(myAccounts);

        // Try to fetch loans
        const loans = await apiFetch<Loan[]>('/loans');
        if (cancelled) return;

        // Find the "active" loan (disbursed/approved/pending)
        const activeLoan = loans.find(
          (l) =>
            l.status === 'disbursed' ||
            l.status === 'approved' ||
            l.status === 'pending',
        );

        if (activeLoan) {
          setLoan(activeLoan);
          try {
            const schedule = await apiFetch<ScheduleRow[]>(
              `/loans/${activeLoan.id}/schedule`,
            );
            if (cancelled) return;
            const next = schedule.find((s) => !s.paid);
            setNextInstallment(next ?? null);
          } catch {
            // Schedule fetch failed, but loan info is still useful
          }
        }
      } catch (err) {
        if (!cancelled) {
          // Only show error to non-member roles
          // Members shouldn't see backend role errors
          if (userRole !== 'member') {
            setError(
              err instanceof Error ? err.message : 'Failed to load data',
            );
          }
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, userRole, memberId]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-slate-600">{t('dashboard_loading')}</p>
        </div>
      </main>
    );
  }

  const totalSavings = savings.reduce((sum, a) => sum + Number(a.balance), 0);
  const accountLabel =
    savings.length === 1 ? t('common_account') : t('common_accounts');

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto p-6 min-h-screen bg-gradient-mesh">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {t('dashboard_welcome')},{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {user.username}
            </span>
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Here&apos;s your SACCO overview for today
          </p>
        </div>

        {/* Quick Actions — role-dependent */}
        <div className="flex flex-wrap gap-2 mb-8">
          <QuickAction href="/statements" label="View Statements" icon="📄" />
          {can(user.role, 'apply_loan') && (
            <QuickAction
              href="/apply"
              label="Apply for Loan"
              accent="blue"
              icon="➕"
            />
          )}
          {can(user.role, 'approve_loan') && (
            <QuickAction
              href="/pending"
              label="Review Pending Loans"
              accent="amber"
              icon="✓"
            />
          )}
          {can(user.role, 'create_member') && (
            <QuickAction
              href="/admin/members"
              label="Manage Members"
              accent="green"
              icon="👥"
            />
          )}
          {can(user.role, 'view_reports') && (
            <QuickAction
              href="/reports"
              label="View Reports"
              accent="purple"
              icon="📊"
            />
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 animate-slide-down">
            {error}
          </div>
        )}

        {fetching ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 stagger">
              <Card
                title={t('dashboard_total_savings')}
                value={formatCurrency(totalSavings, lang)}
                subtitle={`${savings.length} ${accountLabel}`}
                accent="blue"
                icon="💰"
              />

              {loan ? (
                <Link href={`/loans/${loan.id}`} className="block">
                  <Card
                    title={t('dashboard_active_loan')}
                    value={formatCurrency(loan.principal, lang)}
                    subtitle={`${loan.loanType} · ${t('dashboard_view_details')} →`}
                    accent="amber"
                    icon="📋"
                  />
                </Link>
              ) : (
                <Card
                  title={t('dashboard_active_loan')}
                  value={t('common_dash')}
                  subtitle={t('dashboard_no_active_loan')}
                  accent="amber"
                  icon="📋"
                />
              )}

              <Card
                title={t('dashboard_next_payment')}
                value={
                  nextInstallment
                    ? formatCurrency(nextInstallment.totalDue, lang)
                    : t('common_dash')
                }
                subtitle={
                  nextInstallment
                    ? formatDate(nextInstallment.dueDate, lang)
                    : t('dashboard_no_active_loan')
                }
                accent="green"
                icon="📅"
              />
            </div>

            {/* Savings Accounts */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden animate-slide-up">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-sm">
                    💰
                  </span>
                  {t('dashboard_savings_accounts')}
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {savings.length} account{savings.length === 1 ? '' : 's'}
                </span>
              </div>
              {savings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-slate-600 text-sm">
                    {t('dashboard_no_accounts')}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-600 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 font-medium">
                        {t('table_type')}
                      </th>
                      <th className="px-6 py-3 font-medium">
                        {t('table_opened')}
                      </th>
                      <th className="px-6 py-3 font-medium text-right">
                        {t('table_balance')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-900">
                    {savings.map((a) => (
                      <tr
                        key={a.id}
                        className="border-t border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4 capitalize font-medium">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {a.accountType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(a.openedAt, lang)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold">
                          {formatCurrency(a.balance, lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Active Loan */}
            {loan && (
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center text-white text-sm">
                      📋
                    </span>
                    {t('dashboard_active_loan_section')}
                  </h2>
                </div>
                <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <Stat label={t('table_type')} value={loan.loanType} />
                  <Stat
                    label={t('table_principal')}
                    value={formatCurrency(loan.principal, lang)}
                  />
                  <Stat
                    label={t('table_outstanding')}
                    value={formatCurrency(loan.outstandingBalance, lang)}
                  />
                  <Stat label={t('table_status')} value={loan.status} />
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────────

function Card({
  title,
  value,
  subtitle,
  accent,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent: 'blue' | 'amber' | 'green';
  icon?: string;
}) {
  const accentMap = {
    blue: {
      border: 'border-blue-100',
      iconBg: 'bg-gradient-primary',
      accentBar: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    amber: {
      border: 'border-amber-100',
      iconBg: 'bg-gradient-warm',
      accentBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
    },
    green: {
      border: 'border-emerald-100',
      iconBg: 'bg-gradient-accent',
      accentBar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    },
  }[accent];

  return (
    <div
      className={`group relative block bg-white rounded-2xl border ${accentMap.border} p-5 card-hover animate-slide-up overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentMap.accentBar}`} />

      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold">
          {title}
        </p>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl ${accentMap.iconBg} flex items-center justify-center text-white text-lg shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform`}
          >
            {icon}
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-slate-900 tracking-tight">
        {value}
      </p>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="group">
      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
        {label}
      </p>
      <p className="font-semibold capitalize mt-1 text-slate-900 group-hover:text-blue-700 transition">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon,
  accent = 'gray',
}: {
  href: string;
  label: string;
  icon?: string;
  accent?: 'gray' | 'blue' | 'amber' | 'green' | 'purple';
}) {
  const colors = {
    gray: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200',
    amber: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200',
    green: 'bg-green-50 hover:bg-green-100 text-green-800 border-green-200',
    purple:
      'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200',
  }[accent];

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:shadow-md hover:-translate-y-0.5 ${colors}`}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}