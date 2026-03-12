export enum TransactionType {
  INFLOW = 'inflow',
  OUTFLOW = 'outflow',
  TRANSFER = 'transfer',
}

export interface ITransaction {
  id: string;
  userId: string;
  sourceId: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: Date;
  transferTargetId?: string;
  createdAt: Date;
  updatedAt: Date;
}
