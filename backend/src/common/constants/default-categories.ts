import { CategoryType } from '../interfaces/category.interface';

/**
 * Categories every new account starts with.
 *
 * Without these a freshly registered user has an empty category list, which
 * makes the "Category" field in the Add Transaction form unusable — the
 * transaction API requires a category.
 */
export const DEFAULT_CATEGORIES: { name: string; type: CategoryType }[] = [
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
