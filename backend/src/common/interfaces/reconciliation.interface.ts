export interface IReconciliation {
  id: string;
  userId: string;
  sourceId: string;
  actualBalance: number;
  appBalance: number;
  discrepancy: number;
  reconciledAt: Date;
}
