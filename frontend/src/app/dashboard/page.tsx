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
    if (!user?.id) return;

    let cancelled = false;

    (async () => {
      try {
        const accounts = await apiFetch<SavingsAccount[]>('/savings/accounts');
        if (cancelled) return;
        const myAccounts = accounts.filter((a) => a.memberId === user.id);
        setSavings(myAccounts.length ? myAccounts : accounts);

        const loans = await apiFetch<Loan[]>('/loans');
        if (cancelled) return;
        const mine = loans.find(
          (l) =>
            l.status === 'disbursed' ||
            l.status === 'approved' ||
            l.status === 'pending',
        );
        if (mine) {
          setLoan(mine);
          const schedule = await apiFetch<ScheduleRow[]>(
            `/loans/${mine.id}/schedule`,
          );
          if (cancelled) return;
          const next = schedule.find((s) => !s.paid);
          setNextInstallment(next ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">{t('dashboard_loading')}</p>
      </main>
    );
  }

  const totalSavings = savings.reduce((sum, a) => sum + Number(a.balance), 0);
  const accountLabel =
    savings.length === 1 ? t('common_account') : t('common_accounts');

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          {t('dashboard_welcome')}, {user.username}
        </h1>

        {/* Quick Actions — role-dependent */}
        <div className="flex flex-wrap gap-2 mb-6">
          <QuickAction href="/statements" label="View Statements" />
          {can(user.role, 'apply_loan') && (
            <QuickAction href="/apply" label="Apply for Loan" accent="blue" />
          )}
          {can(user.role, 'approve_loan') && (
            <QuickAction
              href="/pending"
              label="Review Pending Loans"
              accent="amber"
            />
          )}
          {can(user.role, 'create_member') && (
            <QuickAction
              href="/admin/members"
              label="Manage Members"
              accent="green"
            />
          )}
          {can(user.role, 'view_reports') && (
            <QuickAction
              href="/reports"
              label="View Reports"
              accent="purple"
            />
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-gray-700">{t('dashboard_loading')}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card
                title={t('dashboard_total_savings')}
                value={formatCurrency(totalSavings, lang)}
                subtitle={`${savings.length} ${accountLabel}`}
                accent="blue"
              />
              {loan ? (
                <Link href={`/loans/${loan.id}`} className="block">
                  <Card
                    title={t('dashboard_active_loan')}
                    value={formatCurrency(loan.principal, lang)}
                    subtitle={`${loan.loanType} · ${t('dashboard_view_details')} →`}
                    accent="amber"
                  />
                </Link>
              ) : (
                <Card
                  title={t('dashboard_active_loan')}
                  value={t('common_dash')}
                  subtitle={t('dashboard_no_active_loan')}
                  accent="amber"
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
              />
            </div>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <h2 className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">
                {t('dashboard_savings_accounts')}
              </h2>
              {savings.length === 0 ? (
                <p className="px-6 py-4 text-gray-700 text-sm">
                  {t('dashboard_no_accounts')}
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-700">
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-2 font-medium">
                        {t('table_type')}
                      </th>
                      <th className="px-6 py-2 font-medium">
                        {t('table_opened')}
                      </th>
                      <th className="px-6 py-2 font-medium text-right">
                        {t('table_balance')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-900">
                    {savings.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-6 py-3 capitalize">
                          {a.accountType}
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {formatDate(a.openedAt, lang)}
                        </td>
                        <td className="px-6 py-3 text-right font-mono">
                          {formatCurrency(a.balance, lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {loan && (
              <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                <h2 className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">
                  {t('dashboard_active_loan_section')}
                </h2>
                <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
// Helper components — defined AFTER the main component.
// In TypeScript/React, functions can be anywhere at top level.
// Convention: main component first, helpers below.
// ─────────────────────────────────────────────────────────────

function Card({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent: 'blue' | 'amber' | 'green';
}) {
  const accentClasses = {
    blue: 'border-l-4 border-blue-500',
    amber: 'border-l-4 border-amber-500',
    green: 'border-l-4 border-green-500',
  }[accent];

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 ${accentClasses}`}
    >
      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
        {title}
      </p>
      <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-600 uppercase font-semibold">{label}</p>
      <p className="font-medium capitalize mt-1 text-gray-900">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  accent = 'gray',
}: {
  href: string;
  label: string;
  accent?: 'gray' | 'blue' | 'amber' | 'green' | 'purple';
}) {
  const colors = {
    gray: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200',
    amber:
      'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200',
    green:
      'bg-green-50 hover:bg-green-100 text-green-800 border border-green-200',
    purple:
      'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200',
  }[accent];

  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${colors}`}
    >
      {label}
    </Link>
  );
}