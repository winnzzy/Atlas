'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('jordan.parker@atlasbank.com');
  const [password, setPassword] = useState('AtlasBank!2026');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const success = login(email, password);
    if (!success) {
      setError('Invalid demo credentials.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff)] px-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Use the Atlas demo credentials to continue.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" type="submit">
              Continue
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <Link href="/signup" className="font-medium text-[#0f4c81]">
              Create account
            </Link>
            <Link href="/forgot-password" className="font-medium text-[#0f4c81]">
              Forgot password
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
