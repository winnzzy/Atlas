import type { Metadata } from 'next';
import React from 'react';
import { CustomerDashboardPage, customerDashboardData } from '@/features/customer-dashboard';

export const metadata: Metadata = {
  title: 'Atlas Customer Dashboard',
  description: 'Production-ready customer banking dashboard for Atlas.',
};

export default function DashboardPage() {
  return <CustomerDashboardPage data={customerDashboardData} />;
}
