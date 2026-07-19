'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge, Button, Card, CardContent, Input, Switch } from '@atlas/ui';
import { AdminPage } from '@/features/admin/components/admin-page';
import { useAdminMutation, useAdminSettings } from '@/features/admin/hooks';

const schema = z.object({
  transferDaily: z.coerce.number().nonnegative(),
  transferMonthly: z.coerce.number().nonnegative(),
  cardDaily: z.coerce.number().nonnegative(),
  maintenanceMode: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage(): React.JSX.Element {
  const settingsQuery = useAdminSettings();
  const { updateSettings } = useAdminMutation();

  const form = useForm<FormValues>({
    defaultValues: {
      transferDaily: 0,
      transferMonthly: 0,
      cardDaily: 0,
      maintenanceMode: false,
    },
  });

  React.useEffect(() => {
    const settings = settingsQuery.data;
    if (!settings) return;
    form.reset({
      transferDaily: settings.limits['transferDaily'] ?? 0,
      transferMonthly: settings.limits['transferMonthly'] ?? 0,
      cardDaily: settings.limits['cardDaily'] ?? 0,
      maintenanceMode: settings.maintenanceMode,
    });
  }, [form, settingsQuery.data]);

  const onSubmit = form.handleSubmit((values) => {
    const parsed = schema.parse(values);
    updateSettings.mutate({
      limits: {
        transferDaily: parsed.transferDaily,
        transferMonthly: parsed.transferMonthly,
        cardDaily: parsed.cardDaily,
      },
      maintenanceMode: parsed.maintenanceMode,
    });
  });

  const settings = settingsQuery.data;

  return (
    <AdminPage
      title="Settings"
      description="Assets, networks, limits, feature flags, and environment controls"
      actions={
        <Button size="sm" onClick={() => void onSubmit()}>
          Save Settings
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Limits</h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Input
                type="number"
                placeholder="Transfer Daily"
                {...form.register('transferDaily')}
              />
              <Input
                type="number"
                placeholder="Transfer Monthly"
                {...form.register('transferMonthly')}
              />
              <Input type="number" placeholder="Card Daily" {...form.register('cardDaily')} />
            </div>
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <Switch
                checked={form.watch('maintenanceMode')}
                onCheckedChange={(next) => form.setValue('maintenanceMode', next)}
              />
              Maintenance Mode
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Feature Flags
            </h2>
            <div className="space-y-2">
              {Object.entries(settings?.featureFlags ?? {}).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md border border-[var(--color-border-default)] px-3 py-2"
                >
                  <p className="text-xs text-[var(--color-text-secondary)]">{key}</p>
                  <Badge variant={value ? 'success' : 'warning'}>
                    {value ? 'enabled' : 'disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Assets</h2>
            <div className="flex flex-wrap gap-1">
              {(settings?.supportedAssets ?? []).map((value) => (
                <Badge key={value} variant="outline">
                  {value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Networks
            </h2>
            <div className="flex flex-wrap gap-1">
              {(settings?.networks ?? []).map((value) => (
                <Badge key={value} variant="outline">
                  {value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Environment
            </h2>
            <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
              {Object.entries(settings?.environment ?? {}).map(([key, value]) => (
                <p key={key}>
                  {key}: {String(value)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
