import { ProfileController } from './profile.controller';
import type { ProfileService } from './profile.service';
import type { CustomerPreferences, CustomerProfile } from '@atlas/types';

describe('ProfileController', () => {
  const service = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    getSecurity: jest.fn(),
    updateSecurity: jest.fn(),
    getActivity: jest.fn(),
  } as unknown as ProfileService;

  const controller = new ProfileController(service);

  it('returns profile data from the service', async () => {
    const payload = { id: 'mock-user-id' } as CustomerProfile;
    jest.mocked(service.getProfile).mockResolvedValue(payload);
    await expect(controller.getProfile()).resolves.toEqual(payload);
  });

  it('forwards preference updates to the service', async () => {
    const payload = { theme: 'system' } as CustomerPreferences;
    jest.mocked(service.updatePreferences).mockResolvedValue(payload);

    await expect(controller.updatePreferences(payload)).resolves.toEqual(payload);
    expect(jest.mocked(service.updatePreferences)).toHaveBeenCalledWith(payload);
  });
});
