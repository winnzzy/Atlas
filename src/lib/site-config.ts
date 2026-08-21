/**
 * Company / contact details for the public site.
 *
 * These are a last-resort fallback only. The live values configured by an
 * admin (`src/app/admin/settings/page.tsx`, persisted through the backend's
 * public-contact settings and served at `/api/v1/public/contact`) always take
 * priority — see `getPublicContact()` in `src/lib/api.ts`. Every surface that
 * displays contact info (the homepage footer, the Legal → Support & Contact
 * page) reads the live value first and falls back to these env vars only when
 * nothing has been configured yet.
 *
 * No real contact information exists in this project by default, so nothing
 * is hardcoded here: each field reads from an environment variable and
 * otherwise resolves to `null`, in which case the UI renders a clearly-marked
 * "not yet configured" placeholder rather than inventing a value.
 */

function env(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export const siteConfig = {
  name: 'Atlas',
  productName: 'Atlas Digital Banking',
  // Verified contact details — null until configured.
  supportEmail: env(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  supportPhone: env(process.env.NEXT_PUBLIC_SUPPORT_PHONE),
  businessAddress: env(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS),
};

export type SiteConfig = typeof siteConfig;
