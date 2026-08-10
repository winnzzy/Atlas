import type { CustomerProfile, CustomerSecurity } from '@atlas/types';
import type { ProfileContextService } from './profile-context.service';
import type { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const repository = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    getSecurity: jest.fn(),
    updateSecurity: jest.fn(),
    getActivity: jest.fn(),
  } as unknown as ProfileRepository;

  const context = {
    getAuthenticatedCustomerId: jest.fn(() => 'mock-user-id'),
  } as unknown as ProfileContextService;

  const service = new ProfileService(repository, context);

  it('reads the current profile via the mocked customer context', async () => {
    const profile = { id: 'mock-user-id' } as CustomerProfile;
    jest.mocked(repository.getProfile).mockResolvedValue(profile);

    await expect(service.getProfile('mock-user-id')).resolves.toBe(profile);
    expect(jest.mocked(repository.getProfile)).toHaveBeenCalledWith('mock-user-id');
  });

  it('updates security using the mocked customer context', async () => {
    const security = { mfaEnabled: true } as CustomerSecurity;
    jest.mocked(repository.updateSecurity).mockResolvedValue(security);

    await expect(service.updateSecurity('mock-user-id', { mfaEnabled: true })).resolves.toBe(security);
    expect(jest.mocked(repository.updateSecurity)).toHaveBeenCalledWith('mock-user-id', {
      mfaEnabled: true,
    });
  });
});
