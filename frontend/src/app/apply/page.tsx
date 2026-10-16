'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { Nav } from '@/components/nav';

export default function ApplyLoanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [loanType, setLoanType] = useState<
    'emergency' | 'education' | 'housing'
  >('emergency');
  const [principal, setPrincipal] = useState('');
  const [termMonths, setTermMonths] = useState(6);
  const [purpose, setPurpose] = useState('');
  const [memberId, setMemberId] = useState('1');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await apiFetch<{ id: string }>('/loans', {
        method: 'POST',
        body: JSON.stringify({
          memberId,
          loanType,
          principal,
          termMonths,
          purpose: purpose || undefined,
          guarantors: [{ memberId, amount: principal }],
        }),
      });
      setSuccess({ id: result.id });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Failed to submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Apply for a Loan</h1>
        <p className="text-sm text-gray-500 mb-6">
          Fill in the details. Your application will be reviewed by the credit
          committee.
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              ✓ Application submitted
            </h2>
            <p className="text-sm text-green-800 mb-4">
              Loan ID: <span className="font-mono">{success.id}</span>. The
              committee will review it shortly.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Back to dashboard
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Member ID
              </label>
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Loan Type
              </label>
              <select
                value={loanType}
                onChange={(e) =>
                  setLoanType(
                    e.target.value as 'emergency' | 'education' | 'housing',
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="emergency">Emergency — 12%</option>
                <option value="education">Education — 10%</option>
                <option value="housing">Housing — 14%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Principal (ETB)
              </label>
              <input
                type="text"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                required
                placeholder="1000.00"
                pattern="^\d+(\.\d{1,2})?$"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 3× your total savings.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Term (months)
              </label>
              <input
                type="number"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                min={1}
                max={60}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Purpose (optional)
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
