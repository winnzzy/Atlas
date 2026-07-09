import type {
  CustomerPreferences,
  CustomerProfile,
  CustomerProfileActivity,
  CustomerSecurity,
} from '@atlas/types';
import {
  customerActivityFixture,
  customerPreferencesFixture,
  customerProfileFixture,
  customerSecurityFixture,
} from './fixtures';

export interface CustomerProfileGateway {
  getProfile(): Promise<CustomerProfile>;
  getPreferences(): Promise<CustomerPreferences>;
  getSecurity(): Promise<CustomerSecurity>;
  getActivity(): Promise<CustomerProfileActivity>;
}

export class MockCustomerProfileGateway implements CustomerProfileGateway {
  async getProfile(): Promise<CustomerProfile> {
    return customerProfileFixture;
  }

  async getPreferences(): Promise<CustomerPreferences> {
    return customerPreferencesFixture;
  }

  async getSecurity(): Promise<CustomerSecurity> {
    return customerSecurityFixture;
  }

  async getActivity(): Promise<CustomerProfileActivity> {
    return customerActivityFixture;
  }
}

export const mockCustomerProfileGateway = new MockCustomerProfileGateway();
