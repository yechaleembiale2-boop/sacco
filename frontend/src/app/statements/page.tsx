'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Nav } from '@/components/nav';
import { useLanguage } from '@/lib/language-context';
import { formatCurrency, formatDate } from '@/lib/format';

interface SavingsAccount {
  id: string;
  memberId: string;
  accountType: string;
  balance: string;
  openedAt: string;
}

interface Transaction {
  id: string;
  accountId: string;
  txnType: 'deposit' | 'withdrawal';
  amount: string;
  notes: string | null;
  postedAt: string;
  createdBy: string | null;
}

export default function StatementsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
        const all = await apiFetch<SavingsAccount[]>('/savings/accounts');
        if (cancelled) return;
        const mine = all.filter((a) => a.memberId === user.id);
        const list = mine.length ? mine : all;
        setAccounts(list);
        if (list.length > 0) setSelected(list[0].id);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;

    (async () => {
      try {
        const txns = await apiFetch<Transaction[]>(
          `/savings/accounts/${selected}/transactions`,
        );
        if (!cancelled) {
          txns.sort(
            (a, b) =>
              new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
          );
          setTransactions(txns);
        }
      } catch {
        if (!cancelled) setTransactions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  const currentAccount = accounts.find((a) => a.id === selected);

  const runningRows = [...transactions].sort(
    (a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime(),
  );

  const withBalance = runningRows
    .reduce<Array<Transaction & { runningBalance: number }>>((rows, t) => {
      const previousBalance =
        rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;
      const amount = Number(t.amount);
      const runningBalance =
        previousBalance + (t.txnType === 'deposit' ? amount : -amount);

      return [...rows, { ...t, runningBalance }];
    }, [])
    .reverse();

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Statements</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-gray-500">Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-500">No savings accounts yet.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <h2 className="px-6 py-4 border-b border-gray-100 font-semibold">
                Select Account
              </h2>
              <div className="p-4 flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a.id)}
                    className={`px-4 py-2 rounded-lg text-sm border transition ${
                      selected === a.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="capitalize">{a.accountType}</span>
                    <span className="ml-2 text-xs opacity-80">
                      {Number(a.balance).toFixed(2)} ETB
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {currentAccount && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold capitalize">
                    {currentAccount.accountType} — Transactions
                  </h2>
                  <span className="text-sm text-gray-500">
                    Balance:{' '}
                    <span className="font-mono font-medium text-gray-900">
                      {Number(currentAccount.balance).toFixed(2)} ETB
                    </span>
                  </span>
                </div>

                {withBalance.length === 0 ? (
                  <p className="px-6 py-4 text-gray-500 text-sm">
                    No transactions yet.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-2 font-medium">Date</th>
                        <th className="px-6 py-2 font-medium">Type</th>
                        <th className="px-6 py-2 font-medium">Notes</th>
                        <th className="px-6 py-2 font-medium text-right">
                          Amount
                        </th>
                        <th className="px-6 py-2 font-medium text-right">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {withBalance.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-6 py-3 text-gray-500">
                            {new Date(t.postedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 capitalize">
                            <span
                              className={
                                t.txnType === 'deposit'
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }
                            >
                              {t.txnType}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-500">
                            {t.notes ?? '—'}
                          </td>
                          <td
                            className={`px-6 py-3 text-right font-mono ${
                              t.txnType === 'deposit'
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}
                          >
                            {t.txnType === 'deposit' ? '+' : '−'}
                            {Number(t.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-gray-700">
                            {t.runningBalance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
