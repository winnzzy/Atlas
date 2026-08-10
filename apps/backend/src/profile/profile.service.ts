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
import { ProfileContextService } from './profile-context.service';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly profileContextService: ProfileContextService,
  ) {}

  getProfile(userId: string): Promise<CustomerProfile> {
    return this.profileRepository.getProfile(this.profileContextService.getAuthenticatedCustomerId(userId));
  }

  updateProfile(userId: string, input: UpdateCustomerProfileInput): Promise<CustomerProfile> {
    return this.profileRepository.updateProfile(
      this.profileContextService.getAuthenticatedCustomerId(userId),
      input,
    );
  }

  getPreferences(userId: string): Promise<CustomerPreferences> {
    return this.profileRepository.getPreferences(
      this.profileContextService.getAuthenticatedCustomerId(userId),
    );
  }

  updatePreferences(userId: string, input: UpdateCustomerPreferencesInput): Promise<CustomerPreferences> {
    return this.profileRepository.updatePreferences(
      this.profileContextService.getAuthenticatedCustomerId(userId),
      input,
    );
  }

  getSecurity(userId: string): Promise<CustomerSecurity> {
    return this.profileRepository.getSecurity(
      this.profileContextService.getAuthenticatedCustomerId(userId),
    );
  }

  updateSecurity(userId: string, input: UpdateCustomerSecurityInput): Promise<CustomerSecurity> {
    return this.profileRepository.updateSecurity(
      this.profileContextService.getAuthenticatedCustomerId(userId),
      input,
    );
  }

  getActivity(userId: string): Promise<CustomerProfileActivity> {
    return this.profileRepository.getActivity(
      this.profileContextService.getAuthenticatedCustomerId(userId),
    );
  }
}
