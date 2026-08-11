import { Test } from '@nestjs/testing';
import { CardController } from '../card.controller';
import { CardService } from '../../services/card.service';

describe('CardController', () => {
  it('delegates issueCard to CardService', async () => {
    const service = {
      issueCard: jest.fn().mockResolvedValue({ id: 'card-1' }),
      searchCards: jest.fn(),
      getCard: jest.fn(),
      updateCard: jest.fn(),
      activateCard: jest.fn(),
      freezeCard: jest.fn(),
      unfreezeCard: jest.fn(),
      lockCard: jest.fn(),
      unlockCard: jest.fn(),
      cancelCard: jest.fn(),
      replaceCard: jest.fn(),
      changePin: jest.fn(),
      regenerateCvv: jest.fn(),
      authorizeTransaction: jest.fn(),
      captureTransaction: jest.fn(),
      completeTransaction: jest.fn(),
      refundTransaction: jest.fn(),
      reverseTransaction: jest.fn(),
      chargebackTransaction: jest.fn(),
      listCardTransactions: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [CardController],
      providers: [{ provide: CardService, useValue: service }],
    }).compile();

    const controller = module.get(CardController);
    const user = { id: 'user-1' } as never;
    const dto = { accountId: 'acc-1', type: 'VIRTUAL_DEBIT' } as never;
    const result = await controller.issueCard(user, dto);

    expect(result).toEqual({ id: 'card-1' });
    expect(service.issueCard).toHaveBeenCalledWith(user, dto);
  });
});
