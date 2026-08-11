'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CreditCard,
  Fingerprint,
  Landmark,
  LineChart,
  Lock,
  Menu,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  Wallet2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminIdentity, getStoredAccessToken } from '@/lib/api';
import { SiteFooter } from '@/components/site-footer';

const features = [
  {
    icon: Landmark,
    title: 'Accounts & balances',
    body: 'Open checking and savings accounts and see current, available, and pending balances the moment they change.',
  },
  {
    icon: TrendingUp,
    title: 'Transfers',
    body: 'Move money between your accounts instantly, or send ACH and wire payments with clear status at every step.',
  },
  {
    icon: CreditCard,
    title: 'Cards',
    body: 'Apply for a debit card, then freeze or unfreeze it in one tap. No plastic is issued until an application is approved.',
  },
  {
    icon: LineChart,
    title: 'Investments',
    body: 'Follow a consolidated portfolio view with holdings, allocation, and value tracked alongside your cash.',
  },
  {
    icon: BellRing,
    title: 'Notifications',
    body: 'Stay ahead of every transfer, card decision, and account change with a real-time activity feed.',
  },
  {
    icon: ReceiptText,
    title: 'Statements & history',
    body: 'Every posting is written to a double-entry ledger, so your transaction history always reconciles.',
  },
];

const capabilities = [
  { label: 'Double-entry ledger', detail: 'Every cent is balanced' },
  { label: 'Server-side authorization', detail: 'On every request' },
  { label: 'Real-time activity', detail: 'Balances that keep up' },
  { label: 'Account controls', detail: 'Freeze, restrict, resolve' },
];

const trustPoints = [
  {
    icon: Lock,
    title: 'Encrypted connections',
    body: 'Traffic between your browser and Atlas travels over encrypted HTTPS.',
  },
  {
    icon: Fingerprint,
    title: 'Authenticated access',
    body: 'Every account action is verified against your identity on the server — never trusted from the browser.',
  },
  {
    icon: ShieldCheck,
    title: 'Account controls',
    body: 'Freeze cards, restrict activity, and review holds. Sensitive operations are authorized and audited.',
  },
  {
    icon: Wallet2,
    title: 'Ledger integrity',
    body: 'Money movements post through a double-entry engine, so balances are always accountable.',
  },
];

export function LandingShell() {
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = getStoredAccessToken();
    setSignedIn(Boolean(token));
    if (!token) return;
    // Admin routing is decided by the server, never by a client-side guess.
    void getAdminIdentity()
      .then((identity) => setIsAdmin(Boolean(identity)))
      .catch(() => setIsAdmin(false));
  }, []);

  const dashboardHref = isAdmin ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen">
      {/* ── Top navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b345a] text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Atlas</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#products" className="atlas-underline hover:text-slate-900">Products</a>
            <a href="#security" className="atlas-underline hover:text-slate-900">Security</a>
            <a href="#company" className="atlas-underline hover:text-slate-900">Company</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {signedIn ? (
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b345a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#092844]"
              >
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#0b345a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#092844]"
                >
                  Open an Account
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-slate-200/70 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <a href="#products" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100">Products</a>
              <a href="#security" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100">Security</a>
              <a href="#company" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100">Company</a>
              <div className="mt-2 flex flex-col gap-2">
                {signedIn ? (
                  <Link href={dashboardHref} className="rounded-xl bg-[#0b345a] px-4 py-2.5 text-center text-white">Go to dashboard</Link>
                ) : (
                  <>
                    <Link href="/login" className="rounded-xl border border-slate-200 px-4 py-2.5 text-center">Sign In</Link>
                    <Link href="/signup" className="rounded-xl bg-[#0b345a] px-4 py-2.5 text-center text-white">Open an Account</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_15%_10%,rgba(11,52,90,0.10),transparent_60%),radial-gradient(50%_50%_at_100%_0%,rgba(27,75,115,0.10),transparent_55%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <div className="atlas-reveal inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0b345a]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Digital banking, done properly
            </div>
            <h1 className="atlas-reveal atlas-delay-1 mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Banking that keeps<br className="hidden sm:block" /> your money accountable.
            </h1>
            <p className="atlas-reveal atlas-delay-2 mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Open an account, move money, manage cards, and track investments in one secure
              workspace — every balance backed by a real double-entry ledger.
            </p>
            <div className="atlas-reveal atlas-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="atlas-lift inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0b345a] px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_30px_rgba(11,52,90,0.22)] hover:bg-[#092844]"
              >
                Open an Account <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Sign In
              </Link>
            </div>
            <div className="atlas-reveal atlas-delay-4 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4" /> Encrypted connection</span>
              <span className="inline-flex items-center gap-1.5"><Fingerprint className="h-4 w-4" /> Server-side authorization</span>
              <span className="inline-flex items-center gap-1.5"><Wallet2 className="h-4 w-4" /> Double-entry ledger</span>
            </div>
          </div>

          {/* Hero visual — a stylized account card, not fabricated figures. */}
          <div className="atlas-fade atlas-delay-2 relative">
            <div className="atlas-float mx-auto max-w-sm">
              <div className="rounded-[28px] border border-white/40 bg-[linear-gradient(150deg,#0b345a_0%,#123f66_50%,#1d4d74_100%)] p-6 text-white shadow-[0_30px_80px_rgba(11,52,90,0.35)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Atlas Checking</span>
                  <ShieldCheck className="h-5 w-5 text-white/80" />
                </div>
                <p className="mt-6 text-xs uppercase tracking-[0.24em] text-white/60">Available balance</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">$ ————</p>
                <div className="mt-8 flex items-center justify-between text-sm">
                  <span className="font-mono tracking-widest text-white/80">•••• •••• •••• 0000</span>
                  <span className="text-white/70">ATLAS</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-2 text-[#0b345a]"><TrendingUp className="h-4 w-4" /><span className="text-sm font-semibold">Transfer sent</span></div>
                  <p className="mt-2 text-xs text-slate-500">Cleared and posted to the ledger</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-2 text-[#0b345a]"><CreditCard className="h-4 w-4" /><span className="text-sm font-semibold">Card frozen</span></div>
                  <p className="mt-2 text-xs text-slate-500">One tap, effective immediately</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Capability strip (no fabricated metrics) ───────────────── */}
      <section className="border-y border-slate-200/70 bg-white/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {capabilities.map((item) => (
            <div key={item.label} className="text-center sm:text-left">
              <p className="text-base font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Products ───────────────────────────────────────────────── */}
      <section id="products" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b345a]">Everything in one place</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            A complete banking workspace
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Accounts, payments, cards, and investments — each one a real, working part of the
            platform, not a preview.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="atlas-lift rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0f5fb] text-[#0b345a]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Security / trust ───────────────────────────────────────── */}
      <section id="security" className="border-y border-slate-200/70 bg-[linear-gradient(180deg,#0b1f38_0%,#0b345a_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Security first</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Built to protect your money
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Security is enforced where it counts — on the server. These are capabilities the
              platform actually implements, not promises.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <point.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{point.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Open your Atlas account today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Create an account in minutes and start banking with a platform that keeps every balance
            accountable.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="atlas-lift inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0b345a] px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_30px_rgba(11,52,90,0.22)] hover:bg-[#092844]"
            >
              Open an Account <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
