import type { Metadata } from 'next';
import React from 'react';
import { ProfileActivityView, mockCustomerProfileGateway } from '@/features/customer-profile';

export const metadata: Metadata = {
  title: 'Atlas Profile Activity',
  description: 'Customer profile activity for Atlas banking customers.',
};

export default async function ProfileActivityPage() {
  const [activity, profile] = await Promise.all([
    mockCustomerProfileGateway.getActivity(),
    mockCustomerProfileGateway.getProfile(),
  ]);

  return <ProfileActivityView activity={activity} profile={profile} />;
}
