import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata = { title: 'Security — Atlas' };

export default function SecurityPage() {
  return (
    <LegalPage
      title="Security"
      intro="The controls Atlas uses to protect your account and your money."
    >
      <LegalSection heading="Authenticated access">
        <p>
          Every request to your account is authenticated, and account actions are authorized on the
          server. Atlas never trusts a claim made by the browser about who you are or what you may do.
        </p>
      </LegalSection>
      <LegalSection heading="Encrypted connections">
        <p>Traffic between your device and Atlas travels over encrypted HTTPS.</p>
      </LegalSection>
      <LegalSection heading="Ledger integrity">
        <p>
          Money movements post through a double-entry ledger. Balances are derived from recorded
          entries, so your account history always reconciles.
        </p>
      </LegalSection>
      <LegalSection heading="Account controls">
        <p>
          You can freeze and unfreeze cards, and administrators can restrict activity or place holds
          where needed. Sensitive operations are recorded in an audit trail.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
