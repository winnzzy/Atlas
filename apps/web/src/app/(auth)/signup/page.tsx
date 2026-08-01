'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, Card, CardContent, Input } from '@atlas/ui';
import { useAuth } from '@/components/providers/auth-provider';

export default function SignUpPage() {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = React.useState('Taylor');
  const [lastName, setLastName] = React.useState('Brooks');
  const [email, setEmail] = React.useState('taylor.brooks@atlasbank.com');
  const [password, setPassword] = React.useState('AtlasBank!2026');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await signUp({ firstName, lastName, email, password });
    if (!response.success) {
      setError(response.error ?? 'Unable to create your account.');
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] shadow-sm">
            <ShieldCheck className="h-6 w-6 text-[var(--color-primary-600)]" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Create your Atlas account</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Open a digital workspace in minutes and start managing your banking experience.</p>
        </div>
        <Card className="border-[var(--color-border-default)] bg-[var(--color-bg-primary)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]" htmlFor="firstName">First name</label>
                  <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="h-11" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]" htmlFor="lastName">Last name</label>
                  <Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} className="h-11" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]" htmlFor="email">Email address</label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="h-11" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]" htmlFor="password">Password</label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 pr-10" />
                  <button type="button" className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-secondary)]" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</Button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[var(--color-primary-600)] hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
