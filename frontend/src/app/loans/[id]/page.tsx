'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Nav } from '@/components/nav';

interface Loan {
  id: string;
  memberId: string;
  loanType: string;
  principal: string;
  interestRate: string;
  termMonths: number;
  purpose: string | null;
  status: string;
  totalInterest: string;
  totalPayable: string;
  outstandingBalance: string;
  appliedAt: string;
  approvedAt: string | null;
  disbursedAt: string | null;
}

interface ScheduleRow {
  id: string;
  installmentNo: number;
  dueDate: string;
  principalDue: string;
  interestDue: string;
  totalDue: string;
  paid: boolean;
  paidAt: string | null;
}

export default function LoanDetailsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const loanId = params.id;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.id || !loanId) return;
    let cancelled = false;

    (async () => {
      try {
        const l = await apiFetch<Loan>(`/loans/${loanId}`);
        if (cancelled) return;
        setLoan(l);
        const s = await apiFetch<ScheduleRow[]>(`/loans/${loanId}/schedule`);
        if (!cancelled) setSchedule(s);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load loan');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, loanId]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  if (fetching) {
    return (
      <>
        <Nav />
        <main className="max-w-5xl mx-auto p-6">
          <p className="text-gray-500">Loading loan details…</p>
        </main>
      </>
    );
  }

  if (error || !loan) {
    return (
      <>
        <Nav />
        <main className="max-w-5xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error ?? 'Loan not found'}
          </div>
          <Link
            href="/dashboard"
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </main>
      </>
    );
  }

  const totalPaid = schedule
    .filter((s) => s.paid)
    .reduce((sum, s) => sum + Number(s.totalDue), 0);
  const totalDue = Number(loan.totalPayable);
  const progressPct = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold mt-2 mb-6 capitalize">
          {loan.loanType} Loan
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <InfoCard
            label="Principal"
            value={`${Number(loan.principal).toFixed(2)} ETB`}
          />
          <InfoCard
            label="Interest Rate"
            value={`${Number(loan.interestRate).toFixed(2)}%`}
          />
          <InfoCard label="Term" value={`${loan.termMonths} months`} />
          <InfoCard label="Status" value={loan.status} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Repayment Progress</h2>
            <span className="text-sm text-gray-600 font-mono">
              {totalPaid.toFixed(2)} / {totalDue.toFixed(2)} ETB
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {progressPct.toFixed(1)}% repaid ·{' '}
            <span className="font-medium">
              {Number(loan.outstandingBalance).toFixed(2)} ETB outstanding
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <InfoCard
            label="Total Interest"
            value={`${Number(loan.totalInterest).toFixed(2)} ETB`}
          />
          <InfoCard
            label="Total Payable"
            value={`${Number(loan.totalPayable).toFixed(2)} ETB`}
          />
          <InfoCard
            label="Outstanding"
            value={`${Number(loan.outstandingBalance).toFixed(2)} ETB`}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <h2 className="px-6 py-4 border-b border-gray-100 font-semibold">
            Repayment Schedule
          </h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr className="border-b border-gray-100">
                <th className="px-6 py-2 font-medium">#</th>
                <th className="px-6 py-2 font-medium">Due Date</th>
                <th className="px-6 py-2 font-medium text-right">Principal</th>
                <th className="px-6 py-2 font-medium text-right">Interest</th>
                <th className="px-6 py-2 font-medium text-right">Total</th>
                <th className="px-6 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-50 last:border-0 ${
                    row.paid ? 'bg-green-50/40' : ''
                  }`}
                >
                  <td className="px-6 py-3 text-gray-500">
                    {row.installmentNo}
                  </td>
                  <td className="px-6 py-3">{row.dueDate}</td>
                  <td className="px-6 py-3 text-right font-mono">
                    {Number(row.principalDue).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono">
                    {Number(row.interestDue).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium">
                    {Number(row.totalDue).toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    {row.paid ? (
                      <span className="text-green-700 text-xs font-medium bg-green-100 px-2 py-0.5 rounded">
                        ✓ Paid
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold mt-1 capitalize">{value}</p>
    </div>
  );
}
