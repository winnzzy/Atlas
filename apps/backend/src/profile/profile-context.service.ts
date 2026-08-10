import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfileContextService {
  getAuthenticatedCustomerId(userId: string): string {
    return userId;
  }
}
