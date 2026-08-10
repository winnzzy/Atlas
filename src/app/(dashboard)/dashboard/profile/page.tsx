'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { loadDashboardData } from '@/lib/api-data';

export default function ProfilePage() {
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '', city: '' });

  useEffect(() => {
    void loadDashboardData().then(({ profile }) => {
      if (profile) {
        setProfile({
          fullName: profile.fullName,
          email: profile.email,
          phone: '',
          city: '',
        });
      }
    });
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
              <Input
                value={profile.fullName}
                onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <Input
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <Input
                value={profile.phone}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
              <Input
                value={profile.city}
                onChange={(event) => setProfile({ ...profile, city: event.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
