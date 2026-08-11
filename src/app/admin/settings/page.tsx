'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { loadAdminSettings } from '@/lib/admin-data';
import { updateAdminSettings } from '@/lib/api';

export default function AdminSettingsPage() {
  const { data, loading, error, reload } = useAdminResource(loadAdminSettings);

  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setFeatureFlags(data.featureFlags);
      setMaintenanceMode(data.maintenanceMode);
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    setNotice(null);
    try {
      await updateAdminSettings({ featureFlags, maintenanceMode });
      setNotice('Settings saved.');
      reload();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminState loading={loading} error={error}>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">Maintenance mode</p>
                  <p className="text-sm text-slate-500">
                    {maintenanceMode ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode((value) => !value)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${maintenanceMode ? 'bg-[#0f4c81] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {maintenanceMode ? 'On' : 'Off'}
                </button>
              </div>

              {Object.entries(featureFlags).length === 0 ? (
                <p className="text-sm text-slate-500">No feature flags configured.</p>
              ) : (
                Object.entries(featureFlags).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm text-slate-500">{value ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFeatureFlags((current) => ({ ...current, [key]: !current[key] }))
                      }
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${value ? 'bg-[#0f4c81] text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {value ? 'On' : 'Off'}
                    </button>
                  </div>
                ))
              )}

              {saveError ? (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {saveError}
                </p>
              ) : null}
              {notice ? (
                <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
                  {notice}
                </p>
              ) : null}

              <Button onClick={() => void save()} disabled={saving}>
                {saving ? 'Saving…' : 'Save settings'}
              </Button>
            </AdminState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AdminState loading={loading} error={error}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">Currencies:</span>
                {(data?.currencies ?? []).map((currency) => (
                  <Badge key={currency} variant="outline">
                    {currency}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">Supported assets:</span>
                {(data?.supportedAssets ?? []).map((asset) => (
                  <Badge key={asset} variant="outline">
                    {asset}
                  </Badge>
                ))}
              </div>
            </AdminState>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
