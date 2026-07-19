import React from 'react';
import { Button, Card, CardContent } from '@atlas/ui';

export type DetailSection = {
  readonly title: string;
  readonly value: unknown;
};

export type DetailDrawerProps = {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly sections: readonly DetailSection[];
};

export function DetailDrawer({
  open,
  title,
  onClose,
  sections,
}: DetailDrawerProps): React.JSX.Element | null {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-[var(--color-border-default)] bg-[var(--color-bg-primary)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="space-y-4 overflow-y-auto p-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {section.title}
              </p>
              <pre className="overflow-auto text-[11px] text-[var(--color-text-secondary)]">
                {JSON.stringify(section.value, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
