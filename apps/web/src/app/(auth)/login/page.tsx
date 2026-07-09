import React from 'react';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="mt-2 text-muted-foreground">Welcome back to Atlas</p>
        </div>
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <p className="text-center text-muted-foreground">
            Login form placeholder - Authentication will be implemented in Phase 2
          </p>
        </div>
      </div>
    </main>
  );
}
