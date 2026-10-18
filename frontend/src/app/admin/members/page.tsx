'use client';

import { useEffect, useState, useMemo } from 'react';
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
  const [search, setSearch] = useState('');
  const [closingId, setClosingId] = useState<string | null>(null);

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

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.memberNo.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)),
    );
  }, [members, search]);

  const handleClose = async (member: Member) => {
    if (member.status === 'closed') {
      setError('Member is already closed');
      return;
    }

    const confirmed = window.confirm(
      `Close ${member.fullName}'s account?\n\n` +
        `This marks the member as "closed" — the record stays in the system ` +
        `for audit purposes. Their savings and loan history are preserved.`,
    );
    if (!confirmed) return;

    setClosingId(member.id);
    setError(null);
    try {
      await apiFetch(`/members/${member.id}`, { method: 'DELETE' });
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close member');
    } finally {
      setClosingId(null);
    }
  };

  if (loading || !user) return null;

  const activeCount = members.filter((m) => m.status === 'active').length;
  const closedCount = members.filter((m) => m.status === 'closed').length;

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto p-6 min-h-screen bg-gradient-mesh">
        <RoleGuard capability="create_member">
          {/* Header */}
          <div className="mb-6 animate-fade-in flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Members
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                {activeCount} active · {closedCount} closed
              </p>
            </div>
            <button
              onClick={() => setShowForm((s) => !s)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:shadow-md hover:-translate-y-0.5 ${
                showForm
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-gradient-primary text-white shadow-lg'
              }`}
            >
              {showForm ? '✕ Cancel' : '+ New Member'}
            </button>
          </div>

          {/* New Member Form */}
          {showForm && (
            <NewMemberForm
              onCreated={() => {
                setShowForm(false);
                void loadMembers();
              }}
            />
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 animate-slide-down flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search */}
          {!fetching && members.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search by member number, name, phone, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* Members Table */}
          {fetching ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-slate-700 font-medium mb-1">
                No members yet
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Register the first member to get started
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg text-sm font-medium"
              >
                + Create First Member
              </button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-slate-700 font-medium">
                {`No members match "${search}"`}
              </p>
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-700 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-medium">Member No</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Contact</th>
                    <th className="px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-900">
                  {filteredMembers.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t border-slate-100 hover:bg-slate-50/80 transition"
                    >
                      <td className="px-6 py-3 font-mono text-slate-700">
                        {m.memberNo}
                      </td>
                      <td className="px-6 py-3 font-medium">{m.fullName}</td>
                      <td className="px-6 py-3 text-slate-600 text-xs">
                        {m.phone ?? '—'}
                        {m.email && (
                          <>
                            <br />
                            {m.email}
                          </>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-600 text-xs">
                        {formatDate(m.createdAt, lang)}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleClose(m)}
                          disabled={
                            m.status === 'closed' || closingId === m.id
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          title={
                            m.status === 'closed'
                              ? 'Already closed'
                              : 'Close member account'
                          }
                        >
                          {closingId === m.id ? (
                            <>
                              <span className="inline-block w-3 h-3 border-2 border-red-300 border-t-red-700 rounded-full animate-spin" />
                              Closing…
                            </>
                          ) : (
                            <>🗑️ Close</>
                          )}
                        </button>
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
    active: 'bg-emerald-100 text-emerald-800',
    suspended: 'bg-amber-100 text-amber-800',
    closed: 'bg-slate-100 text-slate-600',
  } as const;
  const dot = {
    active: 'bg-emerald-500',
    suspended: 'bg-amber-500',
    closed: 'bg-slate-400',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${map[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
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
      className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mb-6 space-y-4 animate-slide-down"
    >
      <h2 className="font-semibold text-slate-900 text-lg">
        Register New Member
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Member No (e.g. IU-2026-0042)"
          value={memberNo}
          onChange={(e) => setMemberNo(e.target.value)}
          required
          className="px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-md disabled:opacity-60 transition"
      >
        {submitting ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Saving…
          </>
        ) : (
          <>✓ Create Member</>
        )}
      </button>
    </form>
  );
}