import type { Meta, StoryObj } from '@storybook/react';
import { ActivityFeed } from './activity-feed';
import type { ActivityItem } from '../types/banking.types';

const meta: Meta<typeof ActivityFeed> = {
  title: 'Banking/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActivityFeed>;

const items: ActivityItem[] = [
  {
    id: 'act-001',
    action: 'login',
    description: 'Successful login from Chrome on macOS',
    timestamp: '2024-01-15T09:00:00Z',
    actor: '192.168.1.1',
  },
  {
    id: 'act-002',
    action: 'transfer_received',
    description: 'Direct deposit of $4,500.00 from Employer',
    timestamp: '2024-01-15T08:30:00Z',
  },
  {
    id: 'act-003',
    action: 'settings_changed',
    description: 'Notification preferences updated',
    timestamp: '2024-01-14T22:00:00Z',
    actor: 'user-001',
  },
];

export const Default: Story = {
  args: { items },
};

export const Limited: Story = {
  args: { items, maxItems: 2 },
};

export const Empty: Story = {
  args: { items: [] },
};
