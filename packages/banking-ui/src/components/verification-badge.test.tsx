/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { VerificationBadge } from './verification-badge';

describe('VerificationBadge', () => {
  it('renders the verified label', () => {
    render(<VerificationBadge status="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('renders the under review label', () => {
    render(<VerificationBadge status="under_review" />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });
});
