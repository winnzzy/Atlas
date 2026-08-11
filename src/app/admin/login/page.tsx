'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminLoginPage() {
  const { authenticate, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const result = await authenticate(email, password);
    if (!result.ok) {
      setError('Unable to sign in with the provided credentials.');
      setIsSubmitting(false);
      return;
    }
    if (!result.isAdmin) {
      // Authenticated, but this account holds no admin grant. Clear the session
      // so it does not silently fall through to the customer dashboard.
      setError('This account does not have administrator access.');
      await logout();
      setIsSubmitting(false);
      return;
    }
    router.replace('/admin');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1f38] px-4 py-12 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Atlas Operations</h1>
          <p className="mt-2 text-sm text-white/70">
            Administrator access. Authorized personnel only.
          </p>
        </div>

        <Card variant="elevated" className="border-white/10 bg-white/95 text-slate-900">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
                  Work email
                </label>
                <Input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@atlas.example"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                <Lock className="h-4 w-4" />
                {isSubmitting ? 'Verifying…' : 'Sign in to console'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/60">
          <Link href="/login" className="font-medium text-white hover:underline">
            Customer sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
