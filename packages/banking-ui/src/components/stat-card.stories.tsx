import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from './stat-card';
import { DollarSign, Users, Activity } from 'lucide-react';

const meta: Meta<typeof StatCard> = {
  title: 'Banking/StatCard',
  component: StatCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Revenue: Story = {
  args: {
    title: 'Monthly Revenue',
    value: '$45,231.89',
    trend: 'up',
    trendValue: '+20.1%',
    icon: <DollarSign className="h-4 w-4" />,
  },
};

export const Users_Stat: Story = {
  args: {
    title: 'Active Users',
    value: '2,350',
    trend: 'up',
    trendValue: '+180',
    icon: <Users className="h-4 w-4" />,
  },
};

export const DownTrend: Story = {
  args: {
    title: 'Expenses',
    value: '$12,450.00',
    trend: 'down',
    trendValue: '-4.5%',
    icon: <Activity className="h-4 w-4" />,
  },
};
