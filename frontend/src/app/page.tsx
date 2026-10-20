'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-300/30 border-t-blue-300 rounded-full animate-spin mb-3" />
          <p className="text-blue-100">Loading…</p>
        </div>
      </main>
    );
  }

  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        {/* ═══ Navigation ═══ */}
        <nav className="sticky top-0 z-40 bg-slate-900/60 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                IU
              </div>
              <span className="font-bold text-lg text-white">SACCO</span>
            </div>
            <Link
              href="/login"
              className="px-5 py-2 rounded-xl bg-white text-slate-900 font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Sign in
            </Link>
          </div>
        </nav>

        {/* ═══ Hero Section ═══ */}
        <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-6 border border-blue-400/30 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Injibara University Staff Cooperative
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight mb-6 animate-fade-in">
            Your SACCO,{' '}
            <span
              style={{
                background:
                  'linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              simplified.
            </span>
          </h1>

          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 animate-fade-in">
            Manage your savings, apply for loans, and track your financial
            journey — all in one secure platform built for Injibara University
            staff.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-16 animate-fade-in">
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-lg"
            >
              Sign in to your account →
            </Link>
            <a
              href="#features"
              className="px-8 py-4 rounded-2xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 hover:-translate-y-0.5 transition-all text-lg backdrop-blur-md"
            >
              Learn more ↓
            </a>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <StatCard icon="👥" value="200+" label="Members" />
            <StatCard icon="💰" value="6.4K" label="ETB Total Savings" />
            <StatCard icon="📋" value="5" label="Active Loans" />
            <StatCard icon="📊" value="100%" label="Ledger Balanced" />
          </div>
        </section>

        {/* ═══ Features Section ═══ */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3">
              Everything you need
            </h2>
            <p className="text-lg text-blue-100">
              A complete digital SACCO platform built from scratch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="💰"
              title="Track Your Savings"
              description="See your balance, transaction history, and monthly contributions in real time. No more visiting the office."
              color="blue"
            />
            <FeatureCard
              icon="📋"
              title="Apply for Loans"
              description="Submit loan applications online. Track approval status and view your full repayment schedule."
              color="amber"
            />
            <FeatureCard
              icon="📊"
              title="Transparent Reports"
              description="Committee members and auditors have real-time access to portfolio reports, trial balance, and income statements."
              color="green"
            />
            <FeatureCard
              icon="🔐"
              title="Bank-Grade Security"
              description="Role-based access with segregation of duties. Every action is logged in a tamper-evident audit trail."
              color="purple"
            />
            <FeatureCard
              icon="📒"
              title="Double-Entry Ledger"
              description="Every transaction is recorded with balanced debits and credits. Financial integrity guaranteed by math."
              color="blue"
            />
            <FeatureCard
              icon="🌍"
              title="Amharic & English"
              description="Full support for Amharic and the Ethiopian calendar. Built for how Injibara University works."
              color="green"
            />
          </div>
        </section>

        {/* ═══ Call to Action ═══ */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 text-center shadow-2xl border border-white/10">
            <h2 className="text-4xl font-bold mb-4 text-white">
              Ready to manage your finances?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Log in to access your dashboard, view your savings, apply for
              loans, and track your financial journey.
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 rounded-2xl bg-white text-blue-700 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg"
            >
              Sign in now →
            </Link>
          </div>
        </section>

        {/* ═══ Footer ═══ */}
        <footer className="border-t border-white/10 mt-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  IU
                </div>
                <span className="text-sm text-blue-200">
                  Injibara University Staff SACCO
                </span>
              </div>
              <p className="text-xs text-blue-300/70">
                © 2026 · Built with NestJS and Next.js
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 card-hover">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-blue-200 uppercase tracking-wide font-medium mt-1">
        {label}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: 'blue' | 'amber' | 'green' | 'purple';
}) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-orange-500',
    green: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-pink-500',
  }[color];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 card-hover">
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorMap} flex items-center justify-center text-white text-2xl shadow-lg mb-4`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
      <p className="text-sm text-blue-100 leading-relaxed">{description}</p>
    </div>
  );
}