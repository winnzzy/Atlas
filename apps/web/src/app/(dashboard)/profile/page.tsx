import type { Metadata } from 'next';
import React from 'react';
import { ProfileOverviewView, mockCustomerProfileGateway } from '@/features/customer-profile';

export const metadata: Metadata = {
  title: 'Atlas Customer Profile',
  description: 'Customer profile overview for Atlas banking customers.',
};

export default async function ProfilePage() {
  const [profile, security] = await Promise.all([
    mockCustomerProfileGateway.getProfile(),
    mockCustomerProfileGateway.getSecurity(),
  ]);

  return <ProfileOverviewView profile={profile} security={security} />;
}
