import type { Metadata } from 'next';
import React from 'react';
import { ProfilePreferencesView, mockCustomerProfileGateway } from '@/features/customer-profile';

export const metadata: Metadata = {
  title: 'Atlas Profile Preferences',
  description: 'Customer profile preferences for Atlas banking customers.',
};

export default async function ProfilePreferencesPage() {
  const preferences = await mockCustomerProfileGateway.getPreferences();
  return <ProfilePreferencesView preferences={preferences} />;
}
