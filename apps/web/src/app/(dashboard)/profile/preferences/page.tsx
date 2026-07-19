import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Atlas Profile Preferences',
  description: 'Customer profile preferences for Atlas banking customers.',
};

export default async function ProfilePreferencesPage() {
  redirect('/dashboard/profile/preferences');
}
