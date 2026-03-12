export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface ICategory {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
}
