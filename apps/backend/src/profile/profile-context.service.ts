import { Injectable } from '@nestjs/common';
import { MOCK_CUSTOMER_ID } from './profile.fixtures';

@Injectable()
export class ProfileContextService {
  getAuthenticatedCustomerId(): string {
    return MOCK_CUSTOMER_ID;
  }
}
