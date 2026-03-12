import { Injectable } from '@nestjs/common';
import { IUser } from '../interfaces/user.interface';
import { ISource } from '../interfaces/source.interface';
import { ITransaction } from '../interfaces/transaction.interface';
import { ICategory } from '../interfaces/category.interface';
import { IReconciliation } from '../interfaces/reconciliation.interface';

/**
 * In-memory storage service. Replace this with database repositories
 * (e.g. TypeORM, Prisma, Drizzle) when migrating to a real database.
 * Every data access goes through this single service, making the swap trivial.
 */
@Injectable()
export class StorageService {
  private users: IUser[] = [];
  private sources: ISource[] = [];
  private transactions: ITransaction[] = [];
  private categories: ICategory[] = [];
  private reconciliations: IReconciliation[] = [];

  // ── Users ──────────────────────────────────────────────────────────

  findUserByEmail(email: string): IUser | undefined {
    return this.users.find((u) => u.email === email);
  }

  findUserById(id: string): IUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  createUser(user: IUser): IUser {
    this.users.push(user);
    return user;
  }

  // ── Sources ────────────────────────────────────────────────────────

  findSourcesByUserId(userId: string): ISource[] {
    return this.sources.filter((s) => s.userId === userId);
  }

  findSourceById(id: string, userId: string): ISource | undefined {
    return this.sources.find((s) => s.id === id && s.userId === userId);
  }

  createSource(source: ISource): ISource {
    this.sources.push(source);
    return source;
  }

  updateSource(
    id: string,
    userId: string,
    updates: Partial<ISource>,
  ): ISource | undefined {
    const source = this.findSourceById(id, userId);
    if (!source) return undefined;
    Object.assign(source, updates, { updatedAt: new Date() });
    return source;
  }

  deleteSource(id: string, userId: string): boolean {
    const idx = this.sources.findIndex(
      (s) => s.id === id && s.userId === userId,
    );
    if (idx === -1) return false;
    this.sources.splice(idx, 1);
    return true;
  }

  // ── Transactions ───────────────────────────────────────────────────

  findTransactionsByUserId(userId: string): ITransaction[] {
    return this.transactions.filter((t) => t.userId === userId);
  }

  findTransactionById(id: string, userId: string): ITransaction | undefined {
    return this.transactions.find((t) => t.id === id && t.userId === userId);
  }

  findTransactionsBySourceId(sourceId: string, userId: string): ITransaction[] {
    return this.transactions.filter(
      (t) =>
        t.userId === userId &&
        (t.sourceId === sourceId || t.transferTargetId === sourceId),
    );
  }

  createTransaction(transaction: ITransaction): ITransaction {
    this.transactions.push(transaction);
    return transaction;
  }

  updateTransaction(
    id: string,
    userId: string,
    updates: Partial<ITransaction>,
  ): ITransaction | undefined {
    const tx = this.findTransactionById(id, userId);
    if (!tx) return undefined;
    Object.assign(tx, updates, { updatedAt: new Date() });
    return tx;
  }

  deleteTransaction(id: string, userId: string): ITransaction | undefined {
    const idx = this.transactions.findIndex(
      (t) => t.id === id && t.userId === userId,
    );
    if (idx === -1) return undefined;
    return this.transactions.splice(idx, 1)[0];
  }

  deleteTransactionsBySourceId(sourceId: string, userId: string): void {
    this.transactions = this.transactions.filter(
      (t) =>
        !(
          t.userId === userId &&
          (t.sourceId === sourceId || t.transferTargetId === sourceId)
        ),
    );
  }

  // ── Categories ─────────────────────────────────────────────────────

  findCategoriesByUserId(userId: string): ICategory[] {
    return this.categories.filter((c) => c.userId === userId);
  }

  findCategoryById(id: string, userId: string): ICategory | undefined {
    return this.categories.find((c) => c.id === id && c.userId === userId);
  }

  createCategory(category: ICategory): ICategory {
    this.categories.push(category);
    return category;
  }

  updateCategory(
    id: string,
    userId: string,
    updates: Partial<ICategory>,
  ): ICategory | undefined {
    const cat = this.findCategoryById(id, userId);
    if (!cat) return undefined;
    Object.assign(cat, updates);
    return cat;
  }

  deleteCategory(id: string, userId: string): boolean {
    const idx = this.categories.findIndex(
      (c) => c.id === id && c.userId === userId,
    );
    if (idx === -1) return false;
    this.categories.splice(idx, 1);
    return true;
  }

  // ── Reconciliation ────────────────────────────────────────────────

  findReconciliationsByUserId(userId: string): IReconciliation[] {
    return this.reconciliations.filter((r) => r.userId === userId);
  }

  upsertReconciliation(record: IReconciliation): IReconciliation {
    const idx = this.reconciliations.findIndex(
      (r) => r.userId === record.userId && r.sourceId === record.sourceId,
    );
    if (idx !== -1) {
      this.reconciliations[idx] = record;
    } else {
      this.reconciliations.push(record);
    }
    return record;
  }
}
