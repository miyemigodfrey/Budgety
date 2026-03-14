import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { StorageService } from './storage.service';
import { TransactionType } from '../interfaces/transaction.interface';
import { CategoryType } from '../interfaces/category.interface';

/**
 * Seeds the in-memory store with demo data on application startup.
 * Only runs when the store is empty (no users exist).
 *
 * Demo credentials:
 *   email:    demo@budgety.com
 *   password: password123
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly storage: StorageService) {}

  async onModuleInit() {
    // Only seed if no users exist (fresh start)
    if (this.storage.findUserByEmail('demo@budgety.com')) {
      return;
    }

    this.logger.log('Seeding demo data...');

    const userId = crypto.randomUUID();
    const now = new Date();

    // ── Demo User ────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash('password123', 10);
    this.storage.createUser({
      id: userId,
      email: 'demo@budgety.com',
      name: 'Demo User',
      password: hashedPassword,
      createdAt: now,
    });

    // ── Categories ───────────────────────────────────────────────────
    const categories = [
      { name: 'Salary', type: CategoryType.INCOME },
      { name: 'Freelance', type: CategoryType.INCOME },
      { name: 'Investment Returns', type: CategoryType.INCOME },
      { name: 'Food & Groceries', type: CategoryType.EXPENSE },
      { name: 'Transport', type: CategoryType.EXPENSE },
      { name: 'Rent', type: CategoryType.EXPENSE },
      { name: 'Utilities', type: CategoryType.EXPENSE },
      { name: 'Entertainment', type: CategoryType.EXPENSE },
      { name: 'Shopping', type: CategoryType.EXPENSE },
      { name: 'Health', type: CategoryType.EXPENSE },
    ];

    for (const cat of categories) {
      this.storage.createCategory({
        id: crypto.randomUUID(),
        userId,
        name: cat.name,
        type: cat.type,
      });
    }

    // ── Sources ──────────────────────────────────────────────────────
    const gtbankId = crypto.randomUUID();
    const cashId = crypto.randomUUID();
    const savingsId = crypto.randomUUID();

    this.storage.createSource({
      id: gtbankId,
      userId,
      name: 'GTBank',
      balance: 0, // will be computed from transactions
      currency: 'NGN',
      createdAt: now,
      updatedAt: now,
    });

    this.storage.createSource({
      id: cashId,
      userId,
      name: 'Cash',
      balance: 0,
      currency: 'NGN',
      createdAt: now,
      updatedAt: now,
    });

    this.storage.createSource({
      id: savingsId,
      userId,
      name: 'Piggy Vest',
      balance: 0,
      currency: 'NGN',
      createdAt: now,
      updatedAt: now,
    });

    // ── Transactions ─────────────────────────────────────────────────
    // Helper to create dates relative to now
    const daysAgo = (d: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      return date;
    };

    const transactions = [
      // Month 1 — salary + expenses
      {
        sourceId: gtbankId,
        type: TransactionType.INFLOW,
        amount: 450_000,
        category: 'Salary',
        note: 'March salary',
        date: daysAgo(30),
      },
      {
        sourceId: gtbankId,
        type: TransactionType.OUTFLOW,
        amount: 120_000,
        category: 'Rent',
        note: 'Monthly rent payment',
        date: daysAgo(28),
      },
      {
        sourceId: gtbankId,
        type: TransactionType.OUTFLOW,
        amount: 15_000,
        category: 'Utilities',
        note: 'Electricity bill',
        date: daysAgo(27),
      },
      {
        sourceId: gtbankId,
        type: TransactionType.OUTFLOW,
        amount: 35_000,
        category: 'Food & Groceries',
        note: 'Monthly grocery shopping',
        date: daysAgo(25),
      },
      // Transfer to savings
      {
        sourceId: gtbankId,
        type: TransactionType.TRANSFER,
        amount: 100_000,
        category: 'Savings',
        note: 'Monthly savings transfer',
        date: daysAgo(24),
        transferTargetId: savingsId,
      },
      // Cash inflow
      {
        sourceId: cashId,
        type: TransactionType.INFLOW,
        amount: 50_000,
        category: 'Freelance',
        note: 'Logo design project',
        date: daysAgo(22),
      },
      // Recent week — mixed activity
      {
        sourceId: gtbankId,
        type: TransactionType.OUTFLOW,
        amount: 8_500,
        category: 'Transport',
        note: 'Uber rides this week',
        date: daysAgo(7),
      },
      {
        sourceId: cashId,
        type: TransactionType.OUTFLOW,
        amount: 12_000,
        category: 'Entertainment',
        note: 'Movie night + dinner',
        date: daysAgo(6),
      },
      {
        sourceId: gtbankId,
        type: TransactionType.OUTFLOW,
        amount: 25_000,
        category: 'Shopping',
        note: 'New headphones',
        date: daysAgo(5),
      },
      {
        sourceId: cashId,
        type: TransactionType.OUTFLOW,
        amount: 5_000,
        category: 'Food & Groceries',
        note: 'Snacks and drinks',
        date: daysAgo(4),
      },
      {
        sourceId: savingsId,
        type: TransactionType.INFLOW,
        amount: 15_000,
        category: 'Investment Returns',
        note: 'Piggy vest interest',
        date: daysAgo(3),
      },
      {
        sourceId: gtbankId,
        type: TransactionType.OUTFLOW,
        amount: 7_500,
        category: 'Health',
        note: 'Pharmacy',
        date: daysAgo(2),
      },
      {
        sourceId: gtbankId,
        type: TransactionType.INFLOW,
        amount: 75_000,
        category: 'Freelance',
        note: 'Web app project milestone',
        date: daysAgo(1),
      },
    ];

    // Track balances to update sources at the end
    const balances: Record<string, number> = {
      [gtbankId]: 0,
      [cashId]: 0,
      [savingsId]: 0,
    };

    for (const tx of transactions) {
      this.storage.createTransaction({
        id: crypto.randomUUID(),
        userId,
        sourceId: tx.sourceId,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        note: tx.note,
        date: tx.date,
        transferTargetId: tx.transferTargetId,
        createdAt: tx.date,
        updatedAt: tx.date,
      });

      // Update running balances
      if (tx.type === TransactionType.INFLOW) {
        balances[tx.sourceId] += tx.amount;
      } else if (tx.type === TransactionType.OUTFLOW) {
        balances[tx.sourceId] -= tx.amount;
      } else if (tx.type === TransactionType.TRANSFER && tx.transferTargetId) {
        balances[tx.sourceId] -= tx.amount;
        balances[tx.transferTargetId] += tx.amount;
      }
    }

    // Apply computed balances to sources
    this.storage.updateSource(gtbankId, userId, {
      balance: balances[gtbankId],
    });
    this.storage.updateSource(cashId, userId, { balance: balances[cashId] });
    this.storage.updateSource(savingsId, userId, {
      balance: balances[savingsId],
    });

    this.logger.log('Demo data seeded successfully');
    this.logger.log('  Login: demo@budgety.com / password123');
    this.logger.log(
      `  Sources: GTBank (${balances[gtbankId].toLocaleString()}), Cash (${balances[cashId].toLocaleString()}), Piggy Vest (${balances[savingsId].toLocaleString()})`,
    );
    this.logger.log(`  Transactions: ${transactions.length}`);
    this.logger.log(`  Categories: ${categories.length}`);
  }
}
