import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly argon2Options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  };

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, this.argon2Options);
  }

  async hashValue(value: string): Promise<string> {
    return argon2.hash(value, this.argon2Options);
  }

  async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hashedPassword, plainPassword);
  }

  async verifyHash(hashedValue: string, plainValue: string): Promise<boolean> {
    return argon2.verify(hashedValue, plainValue);
  }
}
