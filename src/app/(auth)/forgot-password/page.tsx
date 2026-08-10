'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { requestPasswordReset } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await requestPasswordReset(email);
      setMessage('If an account exists, reset instructions were sent to the provided email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send password reset instructions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff)] px-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Request a secure reset link from the backend.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send reset link'}
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
