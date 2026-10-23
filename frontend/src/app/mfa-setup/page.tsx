'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Nav } from '@/components/nav';

export default function MfaSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'intro' | 'scan' | 'verify' | 'done'>('intro');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const startSetup = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch<{
        secret: string;
        otpauthUrl: string;
        qrDataUrl: string;
      }>('/auth/mfa/setup', { method: 'POST', body: '{}' });
      setQrDataUrl(res.qrDataUrl);
      setSecret(res.secret);
      setStep('scan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start MFA setup');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/auth/mfa/verify-setup', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Multi-Factor Authentication
        </h1>
        <p className="text-slate-600 mb-6">
          Add an extra layer of security to your account
        </p>

        {step === 'intro' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-700 mb-4">
              MFA protects your account with a second verification step. Even if
              someone steals your password, they can&apos;t log in without your phone.
            </p>
            <p className="text-sm text-slate-600 mb-6">
              You&apos;ll need an authenticator app like:
              <br />
              • Google Authenticator
              <br />
              • Microsoft Authenticator
              <br />
              • Authy
            </p>
            <button
              onClick={startSetup}
              disabled={submitting}
              className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-medium"
            >
              {submitting ? 'Setting up…' : 'Start setup'}
            </button>
          </div>
        )}

        {step === 'scan' && qrDataUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">
              Step 1: Scan this QR code
            </h2>
            <div className="flex justify-center mb-4">
              <Image
                src={qrDataUrl}
                alt="QR Code"
                width={256}
                height={256}
                unoptimized
                className="w-64 h-64"
              />
            </div>
            {secret && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-slate-600 mb-1">
                  Can&apos;t scan? Enter this code manually:
                </p>
                <p className="font-mono text-sm font-semibold text-slate-900 break-all">
                  {secret}
                </p>
              </div>
            )}
            <button
              onClick={() => setStep('verify')}
              className="w-full bg-gradient-primary text-white py-3 rounded-xl font-medium"
            >
              I&apos;ve scanned it →
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form
            onSubmit={verifyCode}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
          >
            <h2 className="font-semibold text-slate-900 mb-4">
              Step 2: Enter the 6-digit code
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Open your authenticator app and enter the code shown for IU SACCO.
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              placeholder="123456"
              inputMode="numeric"
              autoFocus
              required
              className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-slate-300 rounded-xl mb-4"
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full bg-gradient-primary text-white py-3 rounded-xl font-medium disabled:opacity-60"
            >
              {submitting ? 'Verifying…' : 'Verify and enable MFA'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-semibold text-emerald-900 mb-2">
              MFA Enabled Successfully
            </h2>
            <p className="text-sm text-emerald-800 mb-4">
              Next time you log in, you&apos;ll need your password AND your
              authenticator code.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium"
            >
              Continue to dashboard
            </button>
          </div>
        )}
      </main>
    </>
  );
}