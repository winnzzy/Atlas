'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateSettings, getDemoState } from '@/lib/demo-store';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(getDemoState().settings);

  const toggle = (key: keyof typeof settings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const save = () => {
    updateSettings(settings);
  };

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm text-slate-500">{value ? 'Enabled' : 'Disabled'}</p>
              </div>
              <button
                onClick={() => toggle(key as keyof typeof settings)}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${value ? 'bg-[#0f4c81] text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {value ? 'On' : 'Off'}
              </button>
            </div>
          ))}
          <Button onClick={save}>Save settings</Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
