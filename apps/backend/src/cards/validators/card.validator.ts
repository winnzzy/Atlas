import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CardNetwork, CardTransactionType, CardType } from '../enums/card.enums';

@Injectable()
export class CardValidator {
  validateAmount(amount: string): boolean {
    const parsed = Number(amount);
    return Number.isFinite(parsed) && parsed > 0;
  }

  validatePin(pin: string): boolean {
    return /^\d{4,12}$/.test(pin);
  }

  validateCvv(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  }

  validateExpiry(month: number, year: number): boolean {
    if (month < 1 || month > 12) {
      return false;
    }

    const current = new Date();
    const expiry = new Date(year, month - 1, 1);
    expiry.setMonth(expiry.getMonth() + 1);
    return expiry > current;
  }

  validateCardNumber(cardNumber: string): boolean {
    if (!/^\d{13,19}$/.test(cardNumber)) {
      return false;
    }

    let sum = 0;
    let doubleDigit = false;

    for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
      let digit = Number(cardNumber[index]);
      if (doubleDigit) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      doubleDigit = !doubleDigit;
    }

    return sum % 10 === 0;
  }

  generateCardNumber(network: CardNetwork): string {
    const prefix = network === CardNetwork.MASTERCARD ? '51' : '4';
    const length = 16;
    const digits = prefix + Array.from({ length: length - prefix.length - 1 }, () => Math.floor(Math.random() * 10)).join('');
    const checkDigit = this.luhnCheckDigit(digits);
    return `${digits}${checkDigit}`;
  }

  generateCvv(): string {
    return randomBytes(2).toString('hex').replace(/[^0-9]/g, '').slice(0, 3).padEnd(3, '0');
  }

  generateToken(prefix: string): string {
    return `${prefix}_${randomBytes(16).toString('hex')}`;
  }

  maskCardNumber(cardNumber: string): string {
    return `${cardNumber.slice(0, 6)}${'•'.repeat(Math.max(cardNumber.length - 10, 0))}${cardNumber.slice(-4)}`;
  }

  hashValue(value: string): string {
    return `hash_${Buffer.from(value).toString('base64url')}`;
  }

  validateTransactionType(type: CardTransactionType): boolean {
    return Object.values(CardTransactionType).includes(type);
  }

  validateCardType(type: CardType): boolean {
    return Object.values(CardType).includes(type);
  }

  private luhnCheckDigit(digits: string): string {
    let sum = 0;
    let doubleDigit = true;

    for (let index = digits.length - 1; index >= 0; index -= 1) {
      let digit = Number(digits[index]);
      if (doubleDigit) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      doubleDigit = !doubleDigit;
    }

    return String((10 - (sum % 10)) % 10);
  }
}
