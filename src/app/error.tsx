'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff)] px-4">
      <Card className="w-full max-w-md border-slate-200 text-center">
        <CardContent className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="text-sm text-slate-500">
            Atlas could not complete that request. Please try again.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Button variant="secondary" asChild>
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
