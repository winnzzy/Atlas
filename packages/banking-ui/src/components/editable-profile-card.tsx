'use client';

import * as React from 'react';
import { Pencil } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui';

interface EditableProfileCardProps {
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
  readonly actionLabel?: string;
  readonly actionDisabled?: boolean;
}

export function EditableProfileCard({
  title,
  description,
  children,
  actionLabel = 'Edit',
  actionDisabled = true,
}: EditableProfileCardProps) {
  return (
    <Card variant="elevated" className="bg-background">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Pencil />}
          disabled={actionDisabled}
          aria-label={`${actionLabel} ${title}`}
        >
          {actionLabel}
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
