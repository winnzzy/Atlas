import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { SiteFooter } from '@/components/site-footer';

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b345a] text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Atlas</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{intro}</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-700">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
