'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { Nav } from '@/components/nav';
import { RoleGuard } from '@/components/role-guard';
import { formatCurrency, formatDate } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';

interface Loan {
  id: string;
  memberId: string;
  loanType: string;
  principal: string;
  interestRate: string;
  termMonths: number;
  purpose: string | null;
  status: string;
  appliedBy: string;
  appliedAt: string;
}

export default function PendingLoansPage() {
  const { user, loading } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const load = async () => {
    const list = await apiFetch<Loan[]>('/loans');
    return list.filter((l) => l.status === 'pending');
  };

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    const fetchLoans = async () => {
      try {
        const pendingLoans = await load();
        if (!cancelled) setLoans(pendingLoans);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    void fetchLoans();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const approve = async (id: string) => {
    setActing(id);
    setError(null);
    try {
      await apiFetch(`/loans/${id}/approve`, { method: 'POST', body: '{}' });
      setLoans(await load());
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Failed to approve',
      );
    } finally {
      setActing(null);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <RoleGuard capability="approve_loan">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Pending Loan Applications
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {fetching ? (
            <p className="text-gray-700">Loading…</p>
          ) : loans.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-700">
                No pending applications. All caught up.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((l) => (
                <div
                  key={l.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-semibold text-gray-900 capitalize">
                          {l.loanType} Loan
                        </h2>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                          pending
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <Info
                          label="Principal"
                          value={formatCurrency(l.principal, lang)}
                        />
                        <Info
                          label="Rate"
                          value={`${Number(l.interestRate).toFixed(2)}%`}
                        />
                        <Info label="Term" value={`${l.termMonths} mo`} />
                        <Info
                          label="Applied"
                          value={formatDate(l.appliedAt, lang)}
                        />
                      </div>
                      {l.purpose && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Purpose:</span>{' '}
                          {l.purpose}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        disabled={acting === l.id || l.appliedBy === user.id}
                        onClick={() => approve(l.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition text-sm font-medium"
                      >
                        {acting === l.id ? 'Processing…' : 'Approve'}
                      </button>
                      {l.appliedBy === user.id && (
                        <p className="text-xs text-amber-700 max-w-[140px]">
                          You applied — another committee member must approve
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </RoleGuard>
      </main>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
      <p className="text-gray-900 font-medium mt-0.5">{value}</p>
    </div>
  );
}