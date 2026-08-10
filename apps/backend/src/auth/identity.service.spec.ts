import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  it('uses the current timestamp when consent dates are missing', async () => {
    const createUser = jest.fn().mockResolvedValue({ id: 'user-1' });
    const findUserByEmail = jest.fn().mockResolvedValue(null);
    const hashPassword = jest.fn().mockResolvedValue('hashed-password');

    const service = new IdentityService(
      {
        findUserByEmail,
        createUser,
      } as never,
      {
        hashPassword,
      } as never,
    );

    const now = new Date('2025-01-01T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    try {
      await service.register({
        email: 'user@example.com',
        password: 'StrongPass123!',
        firstName: 'Integration',
        lastName: 'User',
      } as never);
    } finally {
      jest.useRealTimers();
    }

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      }),
    );
  });
});
