'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { completePasswordReset } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      await completePasswordReset(token, password);
      setMessage('Password reset completed. You can now sign in with your new password.');
      setTimeout(() => router.replace('/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff)] px-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Complete the secure password reset flow.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input placeholder="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Input placeholder="Confirm password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save password'}
            </Button>
          </form>
          <Link href="/login" className="mt-4 block text-center text-sm font-medium text-[#0f4c81]">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
