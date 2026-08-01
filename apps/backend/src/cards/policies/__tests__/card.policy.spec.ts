import { CardPolicy } from '../card.policy';
import { CardValidator } from '../../validators/card.validator';
import { CardStatus, CardType } from '../../enums/card.enums';

describe('CardPolicy', () => {
  const policy = new CardPolicy(new CardValidator());

  it('rejects card issuance after max cards', () => {
    const result = policy.canIssueCard(3);
    expect(result.allowed).toBe(false);
    expect(result.violations[0]).toContain('at most 3 cards');
  });

  it('allows authorization for an active card within limits', () => {
    const result = policy.canAuthorizeTransaction(
      {
        id: 'card-1',
        accountId: 'acc-1',
        cardNumber: '4111111111111111',
        maskedNumber: '411111••••••1111',
        lastFour: '1111',
        cardToken: 'card_tkn',
        expiryMonth: 12,
        expiryYear: 2099,
        cvvHash: 'hash',
        cardholderName: 'User',
        type: CardType.VIRTUAL_DEBIT,
        network: 'VISA' as never,
        status: CardStatus.ACTIVATED,
        spendingCategory: 'GENERAL' as never,
        dailyLimit: '5000.00',
        weeklyLimit: '10000.00',
        monthlyLimit: '25000.00',
        singleTxLimit: '2000.00',
        contactlessEnabled: true,
        onlineEnabled: true,
        internationalEnabled: true,
        atmEnabled: true,
        isDemo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      '20.00',
      { accountBalance: '100.00', recentDaySpend: '5.00', recentMonthSpend: '20.00' },
    );

    expect(result.allowed).toBe(true);
  });
});
