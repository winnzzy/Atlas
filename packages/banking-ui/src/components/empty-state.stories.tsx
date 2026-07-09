import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './empty-state';
import { Inbox } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Banking/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No transactions yet',
    description: 'Your transactions will appear here once you start using your account.',
  },
};

export const WithIcon: Story = {
  args: {
    icon: <Inbox className="h-12 w-12 text-muted-foreground" />,
    title: 'No transactions yet',
    description: 'Your transactions will appear here once you start using your account.',
  },
};

export const WithAction: Story = {
  args: {
    icon: <Inbox className="h-12 w-12 text-muted-foreground" />,
    title: 'No transactions yet',
    description: 'Your transactions will appear here once you start using your account.',
    action: (
      <button type="button" className="text-sm text-primary underline">
        Make a transfer
      </button>
    ),
  },
};

export const Minimal: Story = {
  args: {
    title: 'Nothing to show',
  },
};
