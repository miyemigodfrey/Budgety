import { describe, expect, it, beforeEach } from 'bun:test';
import { StorageService } from '../../common/services/storage.service';
import { TransactionsService } from './transactions.service';
import { SourcesService } from '../sources/sources.service';
import { TransactionType } from '../../common/interfaces';
import { computeSourceStats } from '../../common/utils/balance.util';

/**
 * Characterization tests for the balance engine.
 *
 * These pin the CURRENT behaviour of the in-memory implementation so the
 * Prisma port can be checked against them. Where a test encodes something
 * surprising, the comment says so — the point is to capture what the code
 * does today, not what it ideally would do.
 */

const USER = 'user-1';
const OTHER_USER = 'user-2';

let storage: StorageService;
let service: TransactionsService;
let sources: SourcesService;

const makeSource = (id: string, balance: number, userId = USER) =>
  storage.createSource({
    id,
    userId,
    name: id,
    balance,
    currency: 'NGN',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const balanceOf = (id: string, userId = USER) =>
  storage.findSourceById(id, userId)!.balance;

/** Creates a transaction with sensible defaults. */
const create = (
  overrides: Partial<{
    sourceId: string;
    type: TransactionType;
    amount: number;
    category: string;
    note: string;
    date: string;
    transferTargetId: string;
  }> = {},
) =>
  service.create(
    {
      sourceId: 'a',
      type: TransactionType.INFLOW,
      amount: 100,
      category: 'Salary',
      note: '',
      date: new Date().toISOString(),
      ...overrides,
    } as never,
    USER,
  );

beforeEach(() => {
  storage = new StorageService();
  service = new TransactionsService(storage);
  sources = new SourcesService(storage);
});

describe('create', () => {
  it('inflow credits the source', () => {
    makeSource('a', 500);
    create({ type: TransactionType.INFLOW, amount: 100 });
    expect(balanceOf('a')).toBe(600);
  });

  it('outflow debits the source', () => {
    makeSource('a', 500);
    create({ type: TransactionType.OUTFLOW, amount: 100 });
    expect(balanceOf('a')).toBe(400);
  });

  it('transfer debits source and credits target', () => {
    makeSource('a', 500);
    makeSource('b', 50);
    create({
      type: TransactionType.TRANSFER,
      amount: 200,
      transferTargetId: 'b',
    });
    expect(balanceOf('a')).toBe(300);
    expect(balanceOf('b')).toBe(250);
  });

  it('allows spending EXACTLY to zero (the guard is strict <)', () => {
    makeSource('a', 500);
    create({ type: TransactionType.OUTFLOW, amount: 500 });
    expect(balanceOf('a')).toBe(0);
  });

  it('rejects an outflow of balance + 1', () => {
    makeSource('a', 500);
    expect(() =>
      create({ type: TransactionType.OUTFLOW, amount: 501 }),
    ).toThrow('Insufficient balance in "a". Available: 500');
  });

  it('has NO guard on inflow, so it works at zero balance', () => {
    makeSource('a', 0);
    create({ type: TransactionType.INFLOW, amount: 100 });
    expect(balanceOf('a')).toBe(100);
  });

  it('rejects a transfer with no target', () => {
    makeSource('a', 500);
    expect(() => create({ type: TransactionType.TRANSFER, amount: 10 })).toThrow(
      'transferTargetId is required for transfers',
    );
  });

  it('rejects a transfer to the same source', () => {
    makeSource('a', 500);
    expect(() =>
      create({
        type: TransactionType.TRANSFER,
        amount: 10,
        transferTargetId: 'a',
      }),
    ).toThrow('Cannot transfer to the same source');
  });

  it('rejects a transfer to a nonexistent target', () => {
    makeSource('a', 500);
    expect(() =>
      create({
        type: TransactionType.TRANSFER,
        amount: 10,
        transferTargetId: 'nope',
      }),
    ).toThrow('Transfer target source not found');
  });

  it('rejects an unknown source', () => {
    expect(() => create({ sourceId: 'nope' })).toThrow('Source not found');
  });

  it('does not leak across users', () => {
    makeSource('a', 500, OTHER_USER);
    expect(() => create({ sourceId: 'a' })).toThrow('Source not found');
  });
});

describe('update', () => {
  it('increasing an outflow debits the difference', () => {
    makeSource('a', 500);
    const tx = create({ type: TransactionType.OUTFLOW, amount: 100 });
    expect(balanceOf('a')).toBe(400);

    service.update(tx.id, { amount: 300 } as never, USER);
    expect(balanceOf('a')).toBe(200);
  });

  it('decreasing an outflow credits the difference back', () => {
    makeSource('a', 500);
    const tx = create({ type: TransactionType.OUTFLOW, amount: 300 });
    service.update(tx.id, { amount: 100 } as never, USER);
    expect(balanceOf('a')).toBe(400);
  });

  it('changing inflow to outflow swings by twice the amount', () => {
    makeSource('a', 500);
    const tx = create({ type: TransactionType.INFLOW, amount: 100 });
    expect(balanceOf('a')).toBe(600);

    service.update(tx.id, { type: TransactionType.OUTFLOW } as never, USER);
    expect(balanceOf('a')).toBe(400);
  });

  it('moving a transaction to another source rebalances both', () => {
    makeSource('a', 500);
    makeSource('b', 500);
    const tx = create({ type: TransactionType.OUTFLOW, amount: 100 });
    expect(balanceOf('a')).toBe(400);

    service.update(tx.id, { sourceId: 'b' } as never, USER);
    expect(balanceOf('a')).toBe(500);
    expect(balanceOf('b')).toBe(400);
  });

  it('ROLLS BACK fully when the new amount does not fit', () => {
    makeSource('a', 500);
    const tx = create({ type: TransactionType.OUTFLOW, amount: 200 });
    expect(balanceOf('a')).toBe(300);

    // Post-reverse balance would be 500; 900 > 500 so this must fail.
    expect(() =>
      service.update(tx.id, { amount: 900 } as never, USER),
    ).toThrow();

    // The critical assertion: balance restored exactly, not left torn.
    expect(balanceOf('a')).toBe(300);
  });

  it('reports the POST-ROLLBACK balance in the error, not post-reverse', () => {
    // Documents a real bug. `sourceAfterReverse` is a live reference into the
    // store; the rollback mutates it via Object.assign before the template
    // string is evaluated. So the number shown is the original balance (300),
    // NOT the 500 the guard actually compared against.
    // The Prisma port reports 500 instead — see the migration plan.
    makeSource('a', 500);
    const tx = create({ type: TransactionType.OUTFLOW, amount: 200 });

    expect(() => service.update(tx.id, { amount: 900 } as never, USER)).toThrow(
      'Insufficient balance in "a" after edit. Available: 300',
    );
  });

  it('CANNOT clear a transfer target (?? keeps the old value)', () => {
    makeSource('a', 500);
    makeSource('b', 0);
    const tx = create({
      type: TransactionType.TRANSFER,
      amount: 100,
      transferTargetId: 'b',
    });

    // Omitting transferTargetId leaves it set, because the merge uses ??.
    service.update(tx.id, { amount: 200 } as never, USER);
    const after = storage.findTransactionById(tx.id, USER)!;
    expect(after.transferTargetId).toBe('b');
    expect(balanceOf('b')).toBe(200);
  });

  it('rejects an unknown transaction', () => {
    expect(() => service.update('nope', { amount: 1 } as never, USER)).toThrow(
      'Transaction not found',
    );
  });
});

describe('delete', () => {
  it('deleting an outflow always succeeds (reversal only adds)', () => {
    makeSource('a', 500);
    const tx = create({ type: TransactionType.OUTFLOW, amount: 500 });
    expect(balanceOf('a')).toBe(0);

    service.delete(tx.id, USER);
    expect(balanceOf('a')).toBe(500);
  });

  it('refuses to delete an inflow that would go negative', () => {
    makeSource('a', 0);
    const tx = create({ type: TransactionType.INFLOW, amount: 100 });
    expect(balanceOf('a')).toBe(100);

    create({ type: TransactionType.OUTFLOW, amount: 100 });
    expect(balanceOf('a')).toBe(0);

    expect(() => service.delete(tx.id, USER)).toThrow(
      'reversing this inflow would cause negative balance',
    );
    expect(balanceOf('a')).toBe(0);
  });

  it('refuses to delete a transfer when the TARGET is short', () => {
    makeSource('a', 500);
    makeSource('b', 0);
    const tx = create({
      type: TransactionType.TRANSFER,
      amount: 200,
      transferTargetId: 'b',
    });
    expect(balanceOf('b')).toBe(200);

    // Drain the target so reversing (which debits it) would go negative.
    create({ sourceId: 'b', type: TransactionType.OUTFLOW, amount: 200 });
    expect(balanceOf('b')).toBe(0);

    expect(() => service.delete(tx.id, USER)).toThrow(
      'reversing this transfer would cause negative balance',
    );
  });

  it('reverses a transfer on both sides', () => {
    makeSource('a', 500);
    makeSource('b', 0);
    const tx = create({
      type: TransactionType.TRANSFER,
      amount: 200,
      transferTargetId: 'b',
    });

    service.delete(tx.id, USER);
    expect(balanceOf('a')).toBe(500);
    expect(balanceOf('b')).toBe(0);
  });
});

describe('source deletion cascade', () => {
  it('removes transactions on BOTH sides of a transfer', () => {
    makeSource('a', 500);
    makeSource('b', 0);
    create({
      type: TransactionType.TRANSFER,
      amount: 100,
      transferTargetId: 'b',
    });
    create({ type: TransactionType.INFLOW, amount: 50 });
    expect(storage.findTransactionsByUserId(USER)).toHaveLength(2);

    // Deleting the TARGET must also remove the transfer that points at it.
    sources.delete('b', USER);
    const remaining = storage.findTransactionsByUserId(USER);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].type).toBe(TransactionType.INFLOW);
  });
});

describe('opening balance derivation', () => {
  it('recovers the starting balance through all four flow directions', () => {
    makeSource('a', 1000);
    makeSource('b', 1000);

    create({ type: TransactionType.INFLOW, amount: 500 });
    create({ type: TransactionType.OUTFLOW, amount: 200 });
    create({
      type: TransactionType.TRANSFER,
      amount: 300,
      transferTargetId: 'b',
    });
    create({
      sourceId: 'b',
      type: TransactionType.TRANSFER,
      amount: 100,
      transferTargetId: 'a',
    });

    const txs = storage.findTransactionsByUserId(USER);
    expect(
      computeSourceStats('a', balanceOf('a'), txs).openingBalance,
    ).toBe(1000);
    expect(
      computeSourceStats('b', balanceOf('b'), txs).openingBalance,
    ).toBe(1000);
  });
});

describe('invariant fuzz', () => {
  it('balance always equals opening + inflow - outflow + transferIn - transferOut', () => {
    const ids = ['a', 'b', 'c'];
    const opening: Record<string, number> = { a: 100000, b: 50000, c: 25000 };
    for (const id of ids) makeSource(id, opening[id]);

    // Deterministic PRNG so a failure is reproducible.
    let seed = 42;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };

    const types = [
      TransactionType.INFLOW,
      TransactionType.OUTFLOW,
      TransactionType.TRANSFER,
    ];

    for (let i = 0; i < 500; i++) {
      const sourceId = ids[rand(ids.length)];
      const type = types[rand(types.length)];
      const amount = rand(5000) + 1;
      let targetId = ids[rand(ids.length)];
      if (targetId === sourceId) targetId = ids[(ids.indexOf(sourceId) + 1) % 3];

      try {
        create({
          sourceId,
          type,
          amount,
          ...(type === TransactionType.TRANSFER
            ? { transferTargetId: targetId }
            : {}),
        });
      } catch {
        // Insufficient-balance rejections are expected and must leave
        // balances untouched — the invariant check below proves it.
      }

      const txs = storage.findTransactionsByUserId(USER);
      for (const id of ids) {
        const stats = computeSourceStats(id, balanceOf(id), txs);
        expect(stats.openingBalance).toBe(opening[id]);
        expect(balanceOf(id)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
