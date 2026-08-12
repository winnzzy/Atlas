/**
 * Minimal in-memory Prisma double for the cards domain. It backs the real
 * CardRepository in unit tests so the tests exercise the actual persistence
 * mapping (enum handling, metadata `__ext` packing) without a live database.
 * It supports only the query shapes the repository uses: scalar-equality where
 * clauses (including `deletedAt: null`) and id-keyed reads/writes.
 */
type Row = Record<string, unknown>;

function matches(row: Row, where?: Row): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => {
    if (value === null) return row[key] === null || row[key] === undefined;
    return row[key] === value;
  });
}

function makeTable() {
  const rows = new Map<string, Row>();
  const table = {
    async create({ data }: { data: Row }) {
      const now = new Date();
      const stored: Row = { createdAt: now, updatedAt: now, ...data };
      rows.set(stored.id as string, stored);
      return { ...stored };
    },
    async update({ where, data }: { where: { id: string }; data: Row }) {
      const current = rows.get(where.id) ?? {};
      const next: Row = { ...current, ...data, updatedAt: new Date() };
      rows.set(where.id, next);
      return { ...next };
    },
    async upsert({ where, create, update }: { where: { id: string }; create: Row; update: Row }) {
      if (rows.has(where.id)) return table.update({ where, data: update });
      return table.create({ data: create });
    },
    async findUnique({ where }: { where: { id: string } }) {
      const row = rows.get(where.id);
      return row ? { ...row } : null;
    },
    async findFirst({ where }: { where?: Row } = {}) {
      for (const row of rows.values()) if (matches(row, where)) return { ...row };
      return null;
    },
    async findMany({ where }: { where?: Row } = {}) {
      return Array.from(rows.values())
        .filter((row) => matches(row, where))
        .map((row) => ({ ...row }));
    },
    async count({ where }: { where?: Row } = {}) {
      return (await table.findMany({ where })).length;
    },
  };
  return table;
}

export function createCardPrismaDouble() {
  return {
    card: makeTable(),
    cardHolder: makeTable(),
    virtualCard: makeTable(),
    cardTransaction: makeTable(),
  };
}
