import { Injectable, Logger } from '@nestjs/common';

export interface BankDirectoryEntry {
  id: string;
  name: string;
  routingNumber: string;
  /** True when the entry is sandbox/test data rather than a live directory row. */
  sandbox: boolean;
}

/**
 * Configurable bank-directory abstraction.
 *
 * The directory returns a set of generic institution names for the transfer
 * bank selector. When a real provider is integrated, replace `loadEntries()`
 * with a call to it (or set ATLAS_BANK_DIRECTORY to a JSON array of
 * `{ id, name, routingNumber }`); the abstraction and callers stay the same.
 * The `sandbox` flag is internal metadata only — it distinguishes the built-in
 * default list from a configured provider and is never shown to customers.
 */
@Injectable()
export class BankDirectoryService {
  private readonly logger = new Logger(BankDirectoryService.name);

  private readonly defaultEntries: BankDirectoryEntry[] = [
    { id: 'bd-001', name: 'First National Bank', routingNumber: '110000000', sandbox: true },
    { id: 'bd-002', name: 'Community Trust Credit Union', routingNumber: '111000025', sandbox: true },
    { id: 'bd-003', name: 'Metro National Savings', routingNumber: '122000247', sandbox: true },
    { id: 'bd-004', name: 'Pacific Federal Bank', routingNumber: '123000220', sandbox: true },
    { id: 'bd-005', name: 'Heritage Trust & Deposit', routingNumber: '124000054', sandbox: true },
  ];

  private loadEntries(): BankDirectoryEntry[] {
    const raw = process.env['ATLAS_BANK_DIRECTORY'];
    if (!raw) {
      return this.defaultEntries;
    }
    try {
      const parsed = JSON.parse(raw) as Array<{ id?: string; name?: string; routingNumber?: string }>;
      const entries = parsed
        .filter((entry) => entry.name && entry.routingNumber && /^\d{9}$/.test(entry.routingNumber))
        .map((entry, index) => ({
          id: entry.id ?? `cfg-${index}`,
          name: entry.name as string,
          routingNumber: entry.routingNumber as string,
          sandbox: false,
        }));
      return entries.length > 0 ? entries : this.defaultEntries;
    } catch (error) {
      this.logger.warn(
        `ATLAS_BANK_DIRECTORY is not valid JSON, falling back to default entries: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return this.defaultEntries;
    }
  }

  search(query?: string, limit = 25): { items: BankDirectoryEntry[]; sandbox: boolean } {
    const entries = this.loadEntries();
    const normalized = (query ?? '').trim().toLowerCase();
    const filtered = normalized
      ? entries.filter(
          (entry) =>
            entry.name.toLowerCase().includes(normalized) ||
            entry.routingNumber.includes(normalized),
        )
      : entries;
    return {
      items: filtered.slice(0, limit),
      sandbox: entries.every((entry) => entry.sandbox),
    };
  }
}
