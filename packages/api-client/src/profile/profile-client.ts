import type {
  CustomerPreferences,
  CustomerProfile,
  CustomerProfileActivity,
  CustomerSecurity,
  UpdateCustomerPreferencesInput,
  UpdateCustomerProfileInput,
  UpdateCustomerSecurityInput,
} from '@atlas/types';
import type { HttpClient } from '../client/http-client';

export class ProfileApiClient {
  constructor(private readonly httpClient: HttpClient) {}

  getProfile(): Promise<CustomerProfile> {
    return this.httpClient.get<CustomerProfile>('/api/v1/profile');
  }

  updateProfile(body: UpdateCustomerProfileInput): Promise<CustomerProfile> {
    return this.httpClient.patch<CustomerProfile>('/api/v1/profile', body);
  }

  getPreferences(): Promise<CustomerPreferences> {
    return this.httpClient.get<CustomerPreferences>('/api/v1/profile/preferences');
  }

  updatePreferences(body: UpdateCustomerPreferencesInput): Promise<CustomerPreferences> {
    return this.httpClient.patch<CustomerPreferences>('/api/v1/profile/preferences', body);
  }

  getSecurity(): Promise<CustomerSecurity> {
    return this.httpClient.get<CustomerSecurity>('/api/v1/profile/security');
  }

  updateSecurity(body: UpdateCustomerSecurityInput): Promise<CustomerSecurity> {
    return this.httpClient.patch<CustomerSecurity>('/api/v1/profile/security', body);
  }

  getActivity(): Promise<CustomerProfileActivity> {
    return this.httpClient.get<CustomerProfileActivity>('/api/v1/profile/activity');
  }
}
