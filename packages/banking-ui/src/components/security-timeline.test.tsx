/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { SecurityTimeline } from './security-timeline';

describe('SecurityTimeline', () => {
  it('renders timeline events', () => {
    render(
      <SecurityTimeline
        events={[
          {
            id: 'event_1',
            title: 'Authenticator app updated',
            description: 'Security controls were reviewed.',
            severity: 'info',
            occurredAt: '2026-07-09T12:30:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('Authenticator app updated')).toBeInTheDocument();
    expect(screen.getByText('Security controls were reviewed.')).toBeInTheDocument();
  });
});
