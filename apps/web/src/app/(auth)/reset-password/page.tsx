'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, Card, CardContent, Input } from '@atlas/ui';
import { useAuth } from '@/components/providers/auth-provider';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const response = await resetPassword('demo-reset-token', password);
    if (response.success) {
      setMessage(response.message ?? 'Your password has been updated.');
    } else {
      setError(response.error ?? 'Unable to reset your password.');
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
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Set a new password</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Choose a strong password to secure your Atlas account.</p>
        </div>
        <Card className="border-[var(--color-border-default)] bg-[var(--color-bg-primary)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]" htmlFor="password">New password</label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 pr-10" />
                  <button type="button" className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-secondary)]" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</Button>
            </form>
            <Link href="/login" className="mt-4 inline-flex text-sm font-medium text-[var(--color-primary-600)] hover:underline">Return to sign in</Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
