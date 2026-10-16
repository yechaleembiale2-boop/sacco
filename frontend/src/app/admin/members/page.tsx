'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { Nav } from '@/components/nav';
import { RoleGuard } from '@/components/role-guard';
import { formatDate } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';

interface Member {
  id: string;
  memberNo: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  status: 'active' | 'suspended' | 'closed';
  createdAt: string;
}

export default function AdminMembersPage() {
  const { user, loading } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadMembers = async () => {
    try {
      const list = await apiFetch<Member[]>('/members');
      setMembers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const fetchMembers = async () => {
      try {
        const list = await apiFetch<Member[]>('/members');
        if (!cancelled) setMembers(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    void fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading || !user) return null;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <RoleGuard capability="create_member">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Members</h1>
            <button
              onClick={() => setShowForm((s) => !s)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              {showForm ? 'Cancel' : '+ New Member'}
            </button>
          </div>

          {showForm && (
            <NewMemberForm
              onCreated={() => {
                setShowForm(false);
                void loadMembers();
              }}
            />
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {fetching ? (
            <p className="text-gray-700">Loading…</p>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-700">No members yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-700 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-medium">Member No</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Contact</th>
                    <th className="px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  {members.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 font-mono text-gray-700">
                        {m.memberNo}
                      </td>
                      <td className="px-6 py-3 font-medium">{m.fullName}</td>
                      <td className="px-6 py-3 text-gray-600 text-xs">
                        {m.phone ?? '—'}
                        {m.email && (
                          <>
                            <br />
                            {m.email}
                          </>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-600 text-xs">
                        {formatDate(m.createdAt, lang)}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </RoleGuard>
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: Member['status'] }) {
  const map = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-amber-100 text-amber-800',
    closed: 'bg-gray-100 text-gray-700',
  } as const;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${map[status]}`}>
      {status}
    </span>
  );
}

function NewMemberForm({ onCreated }: { onCreated: () => void }) {
  const [memberNo, setMemberNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/members', {
        method: 'POST',
        body: JSON.stringify({
          memberNo,
          fullName,
          phone: phone || undefined,
          email: email || undefined,
        }),
      });
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Failed to create member',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 space-y-3"
    >
      <h2 className="font-semibold text-gray-900 mb-2">Register New Member</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Member No (e.g. IU-2026-0042)"
          value={memberNo}
          onChange={(e) => setMemberNo(e.target.value)}
          required
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition text-sm font-medium"
      >
        {submitting ? 'Saving…' : 'Create Member'}
      </button>
    </form>
  );
}