'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
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
        <p className="text-gray-700">Loading…</p>
      </main>
    );
  }

  const totalSavings = savings.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Welcome, {user.username}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-gray-700">Loading dashboard…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card
                title="Total Savings"
                value={`${totalSavings.toFixed(2)} ETB`}
                subtitle={`${savings.length} account${
                  savings.length === 1 ? '' : 's'
                }`}
                accent="blue"
              />
              {loan ? (
                <Link href={`/loans/${loan.id}`} className="block">
                  <Card
                    title="Active Loan"
                    value={`${Number(loan.principal).toFixed(2)} ETB`}
                    subtitle={`${loan.loanType} · View details →`}
                    accent="amber"
                  />
                </Link>
              ) : (
                <Card
                  title="Active Loan"
                  value="—"
                  subtitle="No active loan"
                  accent="amber"
                />
              )}
              <Card
                title="Next Payment"
                value={
                  nextInstallment
                    ? `${Number(nextInstallment.totalDue).toFixed(2)} ETB`
                    : '—'
                }
                subtitle={nextInstallment?.dueDate ?? 'Nothing due'}
                accent="green"
              />
            </div>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <h2 className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">
                Savings Accounts
              </h2>
              {savings.length === 0 ? (
                <p className="px-6 py-4 text-gray-700 text-sm">
                  No savings accounts yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-700">
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-2 font-medium">Type</th>
                      <th className="px-6 py-2 font-medium">Opened</th>
                      <th className="px-6 py-2 font-medium text-right">
                        Balance
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
                          {a.openedAt}
                        </td>
                        <td className="px-6 py-3 text-right font-mono">
                          {Number(a.balance).toFixed(2)} ETB
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
                  Active Loan
                </h2>
                <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <Stat label="Type" value={loan.loanType} />
                  <Stat
                    label="Principal"
                    value={`${Number(loan.principal).toFixed(2)} ETB`}
                  />
                  <Stat
                    label="Outstanding"
                    value={`${Number(loan.outstandingBalance).toFixed(2)} ETB`}
                  />
                  <Stat label="Status" value={loan.status} />
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

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
      {subtitle && (
        <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
      )}
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