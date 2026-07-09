import { Injectable } from '@nestjs/common';
import type {
  CustomerPreferences,
  CustomerProfile,
  CustomerProfileActivity,
  CustomerSecurity,
  UpdateCustomerPreferencesInput,
  UpdateCustomerProfileInput,
  UpdateCustomerSecurityInput,
} from '@atlas/types';
import type { ProfileContextService } from './profile-context.service';
import type { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly profileContextService: ProfileContextService,
  ) {}

  getProfile(): Promise<CustomerProfile> {
    return this.profileRepository.getProfile(
      this.profileContextService.getAuthenticatedCustomerId(),
    );
  }

  updateProfile(input: UpdateCustomerProfileInput): Promise<CustomerProfile> {
    return this.profileRepository.updateProfile(
      this.profileContextService.getAuthenticatedCustomerId(),
      input,
    );
  }

  getPreferences(): Promise<CustomerPreferences> {
    return this.profileRepository.getPreferences(
      this.profileContextService.getAuthenticatedCustomerId(),
    );
  }

  updatePreferences(input: UpdateCustomerPreferencesInput): Promise<CustomerPreferences> {
    return this.profileRepository.updatePreferences(
      this.profileContextService.getAuthenticatedCustomerId(),
      input,
    );
  }

  getSecurity(): Promise<CustomerSecurity> {
    return this.profileRepository.getSecurity(
      this.profileContextService.getAuthenticatedCustomerId(),
    );
  }

  updateSecurity(input: UpdateCustomerSecurityInput): Promise<CustomerSecurity> {
    return this.profileRepository.updateSecurity(
      this.profileContextService.getAuthenticatedCustomerId(),
      input,
    );
  }

  getActivity(): Promise<CustomerProfileActivity> {
    return this.profileRepository.getActivity(
      this.profileContextService.getAuthenticatedCustomerId(),
    );
  }
}
