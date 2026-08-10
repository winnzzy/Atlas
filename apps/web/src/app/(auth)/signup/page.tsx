'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff)] px-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader>
          <CardTitle>Create your Atlas account</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            This demo accepts any email and password combination.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Full name" />
          <Input placeholder="Email" />
          <Input placeholder="Password" type="password" />
          <Button className="w-full">Create account</Button>
          <Link href="/login" className="block text-center text-sm font-medium text-[#0f4c81]">
            Already have an account?
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
