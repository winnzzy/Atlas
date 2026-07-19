'use client';

import React from 'react';
import { Badge } from '@atlas/ui';

export interface CategoryBadgeProps {
  readonly category: string;
  readonly className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps): React.JSX.Element {
  return (
    <Badge variant="outline" className={className}>
      {category}
    </Badge>
  );
}
