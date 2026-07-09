import type { Metadata } from 'next';
import React from 'react';
import { ProfileSecurityView, mockCustomerProfileGateway } from '@/features/customer-profile';

export const metadata: Metadata = {
  title: 'Atlas Profile Security',
  description: 'Customer profile security settings for Atlas banking customers.',
};

export default async function ProfileSecurityPage() {
  const security = await mockCustomerProfileGateway.getSecurity();
  return <ProfileSecurityView security={security} />;
}
