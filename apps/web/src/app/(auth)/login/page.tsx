'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { Button, Card, CardContent, Input } from '@atlas/ui';
import { useAuth } from '@/components/providers/auth-provider';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('jordan.parker@atlasbank.com');
  const [password, setPassword] = React.useState('AtlasBank!2026');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await signIn(email.trim(), password);
    if (!response.success) {
      setError(response.error ?? 'Unable to sign in.');
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
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Sign in to Atlas
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Access your digital banking workspace with secure local authentication.
          </p>
        </div>

        <Card className="border-[var(--color-border-default)] bg-[var(--color-bg-primary)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]" htmlFor="email">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="h-11"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-secondary)]"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Continue to dashboard'}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
              <Link className="font-medium text-[var(--color-primary-600)] hover:underline" href="/forgot-password">
                Forgot password?
              </Link>
              <Link className="font-medium text-[var(--color-primary-600)] hover:underline" href="/signup">
                Create account
              </Link>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-2 font-medium text-[var(--color-text-primary)]">
                <Sparkles className="h-4 w-4 text-[var(--color-primary-600)]" />
                Demo credentials
              </div>
              <p className="mt-2">Customer: jordan.parker@atlasbank.com / AtlasBank!2026</p>
              <p className="mt-1">Admin: sarah.mitchell@atlasbank.com / AtlasAdmin!2026</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
