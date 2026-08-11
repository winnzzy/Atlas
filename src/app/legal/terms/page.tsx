import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata = { title: 'Terms — Atlas' };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro="The terms that govern your use of the Atlas platform."
    >
      <LegalSection heading="Your account">
        <p>
          When you open an Atlas account you agree to provide accurate information and to keep your
          sign-in credentials secure. You are responsible for activity carried out under your
          account.
        </p>
      </LegalSection>
      <LegalSection heading="Using the service">
        <p>
          Atlas provides accounts, transfers, cards, and investment tracking. Some actions — such as
          card issuance — require review and approval before they take effect.
        </p>
      </LegalSection>
      <LegalSection heading="Account controls">
        <p>
          Atlas may freeze, restrict, or review accounts and cards where required to protect the
          integrity of the platform and its customers.
        </p>
      </LegalSection>
      <LegalSection heading="Changes">
        <p>
          These terms may be updated over time. Continued use of Atlas after an update constitutes
          acceptance of the revised terms.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
