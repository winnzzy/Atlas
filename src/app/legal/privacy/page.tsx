import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata = { title: 'Privacy — Atlas' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      intro="How Atlas handles the information you provide when you use the platform."
    >
      <LegalSection heading="Information we process">
        <p>
          To operate your account, Atlas processes the details you supply — such as your name,
          contact information, and the banking activity you carry out, including accounts,
          transfers, cards, and investments.
        </p>
      </LegalSection>
      <LegalSection heading="How information is used">
        <p>
          Your information is used to provide banking services: authenticating you, authorizing
          your account actions, recording transactions in the ledger, and keeping you informed
          through notifications.
        </p>
      </LegalSection>
      <LegalSection heading="Security of your information">
        <p>
          Access to your data requires authentication, and account actions are authorized on the
          server. Connections to Atlas use encrypted HTTPS.
        </p>
      </LegalSection>
      <LegalSection heading="Contact">
        <p>Questions about privacy can be directed to the Atlas team through our support channel.</p>
      </LegalSection>
    </LegalPage>
  );
}
