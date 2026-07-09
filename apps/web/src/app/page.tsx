import React from 'react';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">Atlas</h1>
        <p className="mt-4 text-xl text-muted-foreground">Digital Banking Platform</p>
        <p className="mt-2 text-muted-foreground">
          US-focused banking with integrated cryptocurrency support
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/login"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </a>
          <a
            href="/dashboard"
            className="rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
