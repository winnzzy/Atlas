'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { registerWithEmailPassword, setStoredAccessToken } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await registerWithEmailPassword({
        firstName,
        lastName,
        email,
        password,
        termsAcceptedAt: new Date().toISOString(),
        privacyAcceptedAt: new Date().toISOString(),
      });

      if (result?.accessToken) {
        setStoredAccessToken(result.accessToken);
        router.replace('/dashboard');
        return;
      }

      setError('Account creation did not return a session.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff)] px-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader>
          <CardTitle>Create your Atlas account</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Sign up with the real backend registration flow.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
              <Input placeholder="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </div>
            <Input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <Link href="/login" className="mt-4 block text-center text-sm font-medium text-[#0f4c81]">
            Already have an account?
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
