import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata = { title: 'Support & Contact — Atlas' };

export default function LegalIndexPage() {
  return (
    <LegalPage
      title="Support & contact"
      intro="Reach the Atlas team and review our legal and regulatory information."
    >
      <LegalSection heading="Contact">
        <p>
          Email:{' '}
          {siteConfig.supportEmail ?? <span className="italic text-slate-400">not yet configured</span>}
        </p>
        <p>
          Phone:{' '}
          {siteConfig.supportPhone ?? <span className="italic text-slate-400">not yet configured</span>}
        </p>
        <p>
          Address:{' '}
          {siteConfig.businessAddress ?? <span className="italic text-slate-400">not yet configured</span>}
        </p>
      </LegalSection>

      <LegalSection heading="Legal documents">
        <p>
          <Link href="/legal/privacy" className="font-medium text-[#0b345a] hover:underline">Privacy policy</Link>
          {' · '}
          <Link href="/legal/terms" className="font-medium text-[#0b345a] hover:underline">Terms of service</Link>
          {' · '}
          <Link href="/legal/security" className="font-medium text-[#0b345a] hover:underline">Security</Link>
        </p>
      </LegalSection>

      <LegalSection heading="Regulatory information">
        <p>
          Atlas does not make any deposit-insurance or regulatory-membership claim. Licensing and
          regulatory details will be published here once verified information is available.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
