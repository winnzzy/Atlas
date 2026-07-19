import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Atlas Profile Activity',
  description: 'Customer profile activity for Atlas banking customers.',
};

export default async function ProfileActivityPage() {
  redirect('/dashboard/profile/activity');
}
