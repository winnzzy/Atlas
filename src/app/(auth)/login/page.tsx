'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const success = await login(email, password);
    if (!success) {
      setError('Unable to sign in with the provided credentials.');
    }

    setIsSubmitting(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(11,52,90,0.14),_transparent_30%)] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
            <ShieldCheck className="h-6 w-6 text-[#0b345a]" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            Sign in to Atlas
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Access secure banking, transfers, cards, and portfolio insights.
          </p>
        </div>

        <Card variant="elevated" className="border-slate-200/80 bg-white/90">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
                  Email address
                </label>
                <Input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300" />
                  Remember me
                </label>
                <Link href="/forgot-password" className="font-medium text-[#0b345a] hover:underline">
                  Forgot password?
                </Link>
              </div>

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                <Lock className="h-4 w-4" />
                {isSubmitting ? 'Signing in…' : 'Sign in securely'}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
              <Link href="/signup" className="font-medium text-[#0b345a] hover:underline">
                Create account
              </Link>
              <span className="flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure connection
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
