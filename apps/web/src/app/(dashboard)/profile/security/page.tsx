import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Atlas Profile Security',
  description: 'Customer profile security settings for Atlas banking customers.',
};

export default async function ProfileSecurityPage() {
  redirect('/dashboard/profile/security');
}
