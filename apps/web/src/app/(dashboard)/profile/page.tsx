import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Atlas Customer Profile',
  description: 'Customer profile overview for Atlas banking customers.',
};

export default async function ProfilePage() {
  redirect('/dashboard/profile');
}
