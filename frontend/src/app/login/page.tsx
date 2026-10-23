'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { user, loading, logout } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, clear the old session so they can log in as someone else
  useEffect(() => {
    if (!loading && user) {
      logout(); 
    }
  }, [user, loading, logout]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          ...(mfaRequired ? { totpCode } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.mfaRequired) {
        setMfaRequired(true);
        setSubmitting(false);
        return;
      }

      // SUCCESS: Save token and force a hard page reload to the dashboard
      localStorage.setItem('token', data.accessToken);
      window.location.href = '/dashboard';
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-mesh px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-primary items-center justify-center text-white font-bold text-2xl mb-3 shadow-lg">
            IU
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mfaRequired ? 'Verify MFA Code' : 'Sign in'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {mfaRequired
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Welcome to Injibara University SACCO'}
          </p>
        </div>

        {!mfaRequired ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full bg-gradient-primary text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-60 transition"
            >
              {submitting ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">
                MFA Code
              </label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                placeholder="123456"
                inputMode="numeric"
                autoFocus
                required
                className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full bg-gradient-primary text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-60 transition"
            >
              {submitting ? 'Verifying…' : 'Verify & Sign in'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}