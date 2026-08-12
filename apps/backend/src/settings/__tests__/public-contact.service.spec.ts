import { AdminPolicy } from '../../admin/policies/admin.policy';
import type { PrismaService } from '../../prisma/prisma.service';
import { PublicContactService } from '../public-contact.service';

type Row = { key: string; value: unknown } | null;

function buildPrisma(initial: Row = null) {
  const store: { current: Row } = { current: initial };
  return {
    systemSetting: {
      findUnique: jest.fn(async () => store.current),
      upsert: jest.fn(async ({ create, update }: { create: { value: unknown }; update: { value: unknown } }) => {
        const value = store.current ? update.value : create.value;
        store.current = { key: 'public_contact', value };
        return store.current;
      }),
    },
    __store: store,
  };
}

const EMPTY = {
  supportEmail: null,
  supportPhone: null,
  businessAddress: null,
  legalEntity: null,
  licenseInfo: null,
  depositInsuranceInfo: null,
};

describe('PublicContactService', () => {
  it('returns an all-null contact when nothing is configured', async () => {
    const prisma = buildPrisma(null);
    const service = new PublicContactService(prisma as unknown as PrismaService);

    await expect(service.getContact()).resolves.toEqual(EMPTY);
  });

  it('persists and normalizes updated contact information', async () => {
    const prisma = buildPrisma(null);
    const service = new PublicContactService(prisma as unknown as PrismaService);

    const saved = await service.updateContact(
      { supportEmail: '  help@atlas.test  ', supportPhone: '', businessAddress: '1 Main St' },
      'admin-1',
    );

    // Trimmed, blank-to-null, and unspecified fields stay null.
    expect(saved.supportEmail).toBe('help@atlas.test');
    expect(saved.supportPhone).toBeNull();
    expect(saved.businessAddress).toBe('1 Main St');
    expect(saved.legalEntity).toBeNull();
    expect(prisma.systemSetting.upsert).toHaveBeenCalledTimes(1);

    // A fresh read reflects the persisted document.
    const fetched = await service.getContact();
    expect(fetched.supportEmail).toBe('help@atlas.test');
    expect(fetched.businessAddress).toBe('1 Main St');
  });

  it('changes only the provided fields, leaving the rest intact', async () => {
    const prisma = buildPrisma(null);
    const service = new PublicContactService(prisma as unknown as PrismaService);

    await service.updateContact({ supportEmail: 'a@b.co' }, 'admin-1');
    const after = await service.updateContact({ supportPhone: '+15550100' }, 'admin-1');

    expect(after.supportEmail).toBe('a@b.co');
    expect(after.supportPhone).toBe('+15550100');
  });
});

describe('public contact authorization', () => {
  const policy = new AdminPolicy();

  it('requires ADMIN to read and SUPER_ADMIN to update public contact', () => {
    expect(() => policy.assertAllowed('ADMIN', 'settings.read')).not.toThrow();
    expect(() => policy.assertAllowed('SUPER_ADMIN', 'settings.write')).not.toThrow();
    // A normal/insufficient admin role cannot write, and support cannot even read.
    expect(() => policy.assertAllowed('ADMIN', 'settings.write')).toThrow();
    expect(() => policy.assertAllowed('SUPPORT', 'settings.read')).toThrow();
  });
});
