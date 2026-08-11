/**
 * Company / contact details for the public site.
 *
 * No real contact information, address, phone number, license, or regulatory
 * identifier exists in this project yet, so nothing is hardcoded here. Each
 * field reads from an environment variable and otherwise resolves to `null`.
 * The footer renders a clearly-marked "not yet configured" placeholder for any
 * null field rather than inventing a value.
 *
 * To go live, set the NEXT_PUBLIC_* variables in the deployment environment
 * with verified values.
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
  // Regulatory / legal identifiers — null until a verified status exists.
  // Do not populate these with anything unverified.
  legalEntity: env(process.env.NEXT_PUBLIC_LEGAL_ENTITY),
  licenseInfo: env(process.env.NEXT_PUBLIC_LICENSE_INFO),
  depositInsuranceInfo: env(process.env.NEXT_PUBLIC_DEPOSIT_INSURANCE_INFO),
};

export type SiteConfig = typeof siteConfig;
