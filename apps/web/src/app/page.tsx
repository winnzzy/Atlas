import Link from 'next/link';
import React from 'react';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)] px-4">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-primary-600)]">Atlas Banking</p>
        <h1 className="mt-4 text-6xl font-bold tracking-tight text-[var(--color-text-primary)]">Modern financial control</h1>
        <p className="mt-4 text-xl text-[var(--color-text-secondary)]">Secure, polished digital banking experience for customers and operators.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/login" className="rounded-md bg-[var(--color-primary-600)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]">
            Open account
          </Link>
        </div>
      </div>
    </main>
  );
}
