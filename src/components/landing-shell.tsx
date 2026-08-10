'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStoredAccessToken } from '@/lib/api';

type LandingUser = {
  role: 'CUSTOMER' | 'SUPER_ADMIN';
};

export function LandingShell() {
  const [user, setUser] = useState<LandingUser | null>(null);

  useEffect(() => {
    const token = getStoredAccessToken();
    setUser(token ? { role: 'CUSTOMER' } : null);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card variant="elevated" className="w-full max-w-5xl overflow-hidden border-slate-200/80 bg-white/90">
        <CardContent className="grid gap-8 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4" />
              Atlas Digital Banking
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Secure banking, payments, cards, and investments in one workspace.
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                A streamlined Atlas experience designed for reliable rendering, simple local demo
                interactions, and Vercel deployment.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
            {user ? (
              <Link
                href={user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard'}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f4c81]"
              >
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Development access
            </p>
            <p className="mt-4 text-sm text-slate-600">
              Demo sign-in is available for local testing and walkthroughs without exposing account
              credentials on the public landing experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
