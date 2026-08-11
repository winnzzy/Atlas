'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, MailCheck, PhoneCall, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { getCustomerProfile, updateProfile, type CustomerProfileResponse } from '@/lib/api';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

function toForm(profile: CustomerProfileResponse): FormState {
  return {
    firstName: profile.personalInformation?.firstName ?? '',
    lastName: profile.personalInformation?.lastName ?? '',
    email: profile.contactInformation?.email ?? '',
    phoneNumber: profile.contactInformation?.phoneNumber ?? '',
    line1: profile.address?.line1 ?? '',
    line2: profile.address?.line2 ?? '',
    city: profile.address?.city ?? '',
    state: profile.address?.state ?? '',
    postalCode: profile.address?.postalCode ?? '',
    country: profile.address?.country ?? '',
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void getCustomerProfile()
      .then((data) => {
        setProfile(data);
        setForm(toForm(data));
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const completion = useMemo(() => {
    const fields = [
      form.firstName,
      form.lastName,
      form.email,
      form.phoneNumber,
      form.line1,
      form.city,
      form.state,
      form.postalCode,
      form.country,
    ];
    const filled = fields.filter((value) => value.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const set = (key: keyof FormState) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateProfile({
        personalInformation: { firstName: form.firstName, lastName: form.lastName },
        contactInformation: {
          email: form.email,
          ...(form.phoneNumber ? { phoneNumber: form.phoneNumber } : {}),
        },
        address: {
          ...(form.line1 ? { line1: form.line1 } : {}),
          ...(form.line2 ? { line2: form.line2 } : {}),
          ...(form.city ? { city: form.city } : {}),
          ...(form.state ? { state: form.state } : {}),
          ...(form.postalCode ? { postalCode: form.postalCode } : {}),
          ...(form.country ? { country: form.country } : {}),
        },
      });
      setProfile(updated);
      setForm(toForm(updated));
      setNotice('Profile updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  const emailVerified = profile?.contactInformation?.emailVerified ?? profile?.verification?.emailVerified;
  const phoneVerified = profile?.contactInformation?.phoneVerified ?? profile?.verification?.phoneVerified;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your personal information, contact details, and address."
      />

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Personal &amp; contact information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading profile…</p>
            ) : (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
                <Field label="First name" value={form.firstName} onChange={set('firstName')} maxLength={100} />
                <Field label="Last name" value={form.lastName} onChange={set('lastName')} maxLength={100} />
                <Field label="Email" value={form.email} onChange={set('email')} placeholder="name@company.com" />
                <Field label="Phone" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+1 555 000 0000" />

                <div className="sm:col-span-2 pt-2">
                  <p className="text-sm font-semibold text-slate-800">Address</p>
                </div>
                <Field label="Address line 1" value={form.line1} onChange={set('line1')} maxLength={120} />
                <Field label="Address line 2" value={form.line2} onChange={set('line2')} maxLength={120} />
                <Field label="City" value={form.city} onChange={set('city')} maxLength={80} />
                <Field label="State" value={form.state} onChange={set('state')} placeholder="CA" maxLength={2} />
                <Field label="Postal code" value={form.postalCode} onChange={set('postalCode')} maxLength={10} />
                <Field label="Country" value={form.country} onChange={set('country')} placeholder="US" maxLength={2} />

                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Profile completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Completed</span>
                <span className="text-lg font-semibold text-slate-900">{completion}%</span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#0b345a] transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Complete your contact and address details to reach 100%.
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <MailCheck className="h-4 w-4 text-slate-400" /> Email
                </span>
                <Badge variant={emailVerified ? 'success' : 'warning'}>
                  {emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <PhoneCall className="h-4 w-4 text-slate-400" /> Phone
                </span>
                <Badge variant={phoneVerified ? 'success' : 'warning'}>
                  {phoneVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <BadgeCheck className="h-4 w-4 text-slate-400" /> Identity (KYC)
                </span>
                <Badge variant="outline">{profile?.verification?.kycStatus ?? 'Not started'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Currency</span>
                <span className="font-medium text-slate-900">{profile?.preferredCurrency ?? 'USD'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Language</span>
                <span className="font-medium text-slate-900 uppercase">{profile?.preferredLanguage ?? 'EN'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Timezone</span>
                <span className="font-medium text-slate-900">{profile?.timezone ?? '—'}</span>
              </div>
              <p className="pt-2 text-xs text-slate-400">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                Your information is authorized and stored securely.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
