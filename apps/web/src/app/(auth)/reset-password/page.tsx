import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff)] px-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Demo flow only. No backend required.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="New password" type="password" />
          <Input placeholder="Confirm password" type="password" />
          <Button className="w-full">Save password</Button>
          <Link href="/login" className="block text-center text-sm font-medium text-[#0f4c81]">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
