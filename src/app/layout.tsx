import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';

export const metadata: Metadata = {
  title: 'Atlas Digital Banking',
  description: 'Atlas digital banking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
