import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff)] px-4">
      <Card className="w-full max-w-md border-slate-200 text-center">
        <CardContent className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
          <p className="text-sm text-slate-500">
            The requested route is not available.
          </p>
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
