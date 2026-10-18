'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language-context';
import { apiFetch } from '@/lib/api';
import { Nav } from '@/components/nav';
import { RoleGuard } from '@/components/role-guard';
import { formatCurrency } from '@/lib/format';

interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  totalDebit: string;
  totalCredit: string;
  balance: string;
}

interface IncomeStatement {
  period: string;
  income: Array<{ code: string; name: string; amount: string }>;
  totalIncome: string;
  netIncome: string;
}

interface SavingsSummary {
  byType: Record<string, { count: number; totalBalance: string }>;
  grandTotal: string;
}

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
  const [income, setIncome] = useState<IncomeStatement | null>(null);
  const [savings, setSavings] = useState<SavingsSummary | null>(null);
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
        const [tb, inc, sav] = await Promise.all([
          apiFetch<TrialBalanceRow[]>('/reports/trial-balance'),
          apiFetch<IncomeStatement>('/reports/income-statement'),
          apiFetch<SavingsSummary>('/reports/savings-summary'),
        ]);
        if (cancelled) return;
        setTrialBalance(tb);
        setIncome(inc);
        setSavings(sav);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load reports');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading || !user) return null;

  const totalDebit = trialBalance.reduce((s, r) => s + Number(r.totalDebit), 0);
  const totalCredit = trialBalance.reduce((s, r) => s + Number(r.totalCredit), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <RoleGuard capability="view_reports">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Financial Reports</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {fetching ? (
            <p className="text-gray-700">Loading reports</p>
          ) : (
            <>
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Trial Balance</h2>
                  {balanced ? (
                    <span className="text-xs bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded">
                       Balanced
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 font-medium px-2 py-0.5 rounded">
                       Unbalanced
                    </span>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-700 bg-gray-50">
                    <tr>
                      <th className="px-6 py-2 font-medium">Code</th>
                      <th className="px-6 py-2 font-medium">Account</th>
                      <th className="px-6 py-2 font-medium">Type</th>
                      <th className="px-6 py-2 font-medium text-right">Debit</th>
                      <th className="px-6 py-2 font-medium text-right">Credit</th>
                      <th className="px-6 py-2 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-900">
                    {trialBalance.map((row) => (
                      <tr key={row.code} className="border-t border-gray-100">
                        <td className="px-6 py-2 font-mono text-gray-600">{row.code}</td>
                        <td className="px-6 py-2">{row.name}</td>
                        <td className="px-6 py-2 capitalize text-gray-600 text-xs">
                          {row.type}
                        </td>
                        <td className="px-6 py-2 text-right font-mono">
                          {Number(row.totalDebit).toFixed(2)}
                        </td>
                        <td className="px-6 py-2 text-right font-mono">
                          {Number(row.totalCredit).toFixed(2)}
                        </td>
                        <td className="px-6 py-2 text-right font-mono font-medium">
                          {Number(row.balance).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                      <td className="px-6 py-3" colSpan={3}>TOTAL</td>
                      <td className="px-6 py-3 text-right font-mono">{totalDebit.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right font-mono">{totalCredit.toFixed(2)}</td>
                      <td className="px-6 py-3"></td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {income && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                  <h2 className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">
                    Income Statement
                  </h2>
                  <table className="w-full text-sm">
                    <tbody className="text-gray-900">
                      {income.income.map((row) => (
                        <tr key={row.code} className="border-t border-gray-100 first:border-t-0">
                          <td className="px-6 py-2 text-gray-600 font-mono w-20">{row.code}</td>
                          <td className="px-6 py-2">{row.name}</td>
                          <td className="px-6 py-2 text-right font-mono">
                            {formatCurrency(row.amount, lang)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                        <td className="px-6 py-3" colSpan={2}>Total Income</td>
                        <td className="px-6 py-3 text-right font-mono">
                          {formatCurrency(income.totalIncome, lang)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              )}

              {savings && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <h2 className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">
                    Savings Summary
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4">
                    {Object.entries(savings.byType).map(([type, data]) => (
                      <div key={type} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 uppercase font-semibold capitalize">
                          {type}
                        </p>
                        <p className="text-xl font-bold mt-1 text-gray-900">
                          {formatCurrency(data.totalBalance, lang)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {data.count} account{data.count === 1 ? '' : 's'}
                        </p>
                      </div>
                    ))}
                    <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                      <p className="text-xs text-blue-700 uppercase font-semibold">
                        Grand Total
                      </p>
                      <p className="text-xl font-bold mt-1 text-blue-900">
                        {formatCurrency(savings.grandTotal, lang)}
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </RoleGuard>
      </main>
    </>
  );
}
