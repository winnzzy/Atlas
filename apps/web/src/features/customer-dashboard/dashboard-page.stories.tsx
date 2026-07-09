import React from 'react';
import { CustomerDashboardPage } from './dashboard-page-content';
import { customerDashboardData } from './fixtures';

const meta = {
  title: 'Customer Dashboard/Page',
  component: CustomerDashboardPage,
};

export default meta;

export const Default = {
  render: () => <CustomerDashboardPage data={customerDashboardData} />,
};
