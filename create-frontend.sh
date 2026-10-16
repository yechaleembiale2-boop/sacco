# Increase memory for Gradle
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m

# Enable Gradle daemon for faster builds
org.gradle.daemon=true

# Enable parallel builds
org.gradle.parallel=true

# Enable caching
org.gradle.caching=true

# Use AndroidX
android.useAndroidX=true
android.enableJetifier=true#!/usr/bin/env bash
set -e

cd ~/sacco/frontend

# --- Create folders ---
mkdir -p src/lib
mkdir -p src/components
mkdir -p src/app/login
mkdir -p src/app/dashboard

echo "✅ Folders created"

# --- .env.local ---
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
EOF

echo "✅ .env.local written"

# --- src/lib/api.ts ---
cat > src/lib/api.ts <<'EOF'
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;
  constructor(err: ApiError) {
    super(err.message);
    this.status = err.status;
    this.details = err.details;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body: { message?: unknown } | null = null;
    try {
      body = await res.json();
    } catch {
      /* ignore non-JSON body */
    }

    const rawMsg = body?.message;
    const message = Array.isArray(rawMsg)
      ? rawMsg.join(', ')
      : typeof rawMsg === 'string'
        ? rawMsg
        : `Request failed with status ${res.status}`;

    throw new ApiRequestError({
      status: res.status,
      message,
      details: body,
    });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
EOF

echo "✅ src/lib/api.ts written"

# --- src/lib/auth.tsx ---
cat > src/lib/auth.tsx <<'EOF'
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiFetch } from './api';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ id: string; username: string; role: string }>('/auth/me')
      .then((u) => setUser({ id: u.id, username: u.username, role: u.role }))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiFetch<{
      accessToken: string;
      user: AuthUser;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('token', res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
EOF

echo "✅ src/lib/auth.tsx written"

# --- src/components/nav.tsx ---
cat > src/components/nav.tsx <<'EOF'
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="font-semibold text-lg">
        IU SACCO
      </Link>
      {user && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {user.username} · <span className="text-gray-400">{user.role}</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 transition"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}
EOF

echo "✅ src/components/nav.tsx written"

# --- src/app/layout.tsx ---
cat > src/app/layout.tsx <<'EOF'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Injibara University SACCO",
  description: "Digital SACCO / Microfinance platform for Injibara University staff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
EOF

echo "✅ src/app/layout.tsx written"

# --- src/app/page.tsx ---
cat > src/app/page.tsx <<'EOF'
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [user, loading, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading…</p>
    </main>
  );
}
EOF

echo "✅ src/app/page.tsx written"

# --- src/app/login/page.tsx ---
cat > src/app/login/page.tsx <<'EOF'
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiRequestError } from '@/lib/api';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    router.replace('/dashboard');
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(
          err.status === 401 ? 'Invalid username or password.' : err.message,
        );
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Injibara University SACCO</h1>
          <p className="text-sm text-gray-500 mt-1">Member portal sign-in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Contact your SACCO officer if you don&apos;t have credentials.
        </p>
      </div>
    </main>
  );
}
EOF

echo "✅ src/app/login/page.tsx written"

# --- src/app/dashboard/page.tsx ---
cat > src/app/dashboard/page.tsx <<'EOF'
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    if (!user) return;

    (async () => {
      try {
        const accounts = await apiFetch<SavingsAccount[]>('/savings/accounts');
        const myAccounts = accounts.filter((a) => a.memberId === user.id);
        setSavings(myAccounts.length ? myAccounts : accounts);

        const loans = await apiFetch<Loan[]>('/loans');
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
          const next = schedule.find((s) => !s.paid);
          setNextInstallment(next ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setFetching(false);
      }
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  const totalSavings = savings.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome, {user.username}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-gray-500">Loading dashboard…</p>
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
              <Card
                title="Active Loan"
                value={loan ? `${Number(loan.principal).toFixed(2)} ETB` : '—'}
                subtitle={loan ? loan.loanType : 'No active loan'}
                accent="amber"
              />
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
              <h2 className="px-6 py-4 border-b border-gray-100 font-semibold">
                Savings Accounts
              </h2>
              {savings.length === 0 ? (
                <p className="px-6 py-4 text-gray-500 text-sm">
                  No savings accounts yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-2 font-medium">Type</th>
                      <th className="px-6 py-2 font-medium">Opened</th>
                      <th className="px-6 py-2 font-medium text-right">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {savings.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-6 py-3 capitalize">{a.accountType}</td>
                        <td className="px-6 py-3 text-gray-500">{a.openedAt}</td>
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
                <h2 className="px-6 py-4 border-b border-gray-100 font-semibold">
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
      <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="font-medium capitalize mt-1">{value}</p>
    </div>
  );
}
EOF

echo "✅ src/app/dashboard/page.tsx written"

echo ""
echo "🎉 All frontend files created."
echo ""
echo "Files:"
ls -la src/lib/ src/components/ src/app/ src/app/login/ src/app/dashboard/