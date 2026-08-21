import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { getPublicContact } from '@/lib/api';
import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata = { title: 'Support & Contact — Atlas' };

// Render per-request rather than at build time: the contact values are
// admin-managed and can change at any time (see getPublicContact() below), so
// this page must never serve a value baked in at the last build/deploy.
export const dynamic = 'force-dynamic';

export default async function LegalIndexPage() {
  // Same live source the homepage footer reads (see SiteFooter): admin-managed
  // contact settings take priority, with the env-var-backed siteConfig used
  // only as a last-resort fallback when nothing has been configured yet.
  const contact = await getPublicContact().catch(() => null);
  const supportEmail = contact?.supportEmail ?? siteConfig.supportEmail;
  const supportPhone = contact?.supportPhone ?? siteConfig.supportPhone;
  const businessAddress = contact?.businessAddress ?? siteConfig.businessAddress;

  return (
    <LegalPage
      title="Support & contact"
      intro="Reach the Atlas team and review our legal information."
    >
      <LegalSection heading="Contact">
        <p>
          Email: {supportEmail ?? <span className="italic text-slate-400">not yet configured</span>}
        </p>
        <p>
          Phone: {supportPhone ?? <span className="italic text-slate-400">not yet configured</span>}
        </p>
        <p>
          Address:{' '}
          {businessAddress ?? <span className="italic text-slate-400">not yet configured</span>}
        </p>
      </LegalSection>

      <LegalSection heading="Legal documents">
        <p>
          <Link href="/legal/privacy" className="font-medium text-[#0b345a] hover:underline">
            Privacy policy
          </Link>
          {' · '}
          <Link href="/legal/terms" className="font-medium text-[#0b345a] hover:underline">
            Terms of service
          </Link>
          {' · '}
          <Link href="/legal/security" className="font-medium text-[#0b345a] hover:underline">
            Security
          </Link>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
