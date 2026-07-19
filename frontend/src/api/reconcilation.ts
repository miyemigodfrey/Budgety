import api from "./axios";

export type ReconcileEntry = {
	sourceId: string;
	actualBalance: number;
};

export type ReconcileResult = {
	id: string;
	userId: string;
	sourceId: string;
	sourceName: string;
	actualBalance: number;
	appBalance: number;
	discrepancy: number;
	reconciledAt: string;
};

export type Discrepancy = {
	sourceId: string;
	sourceName: string;
	actualBalance: number;
	appBalance: number;
	discrepancy: number;
	reconciledAt: string;
};

export type SourceReconciliationSummary = {
	sourceId: string;
	sourceName: string;
	openingBalance: number;
	appBalance: number;
	actualBalance?: number;
	discrepancy?: number;
	lastReconciledAt?: string;
};

// POST /reconcile expects { entries: [{ sourceId, actualBalance }] }
export const createReconciliation = async (
	entries: ReconcileEntry[],
): Promise<ReconcileResult[]> => {
	const res = await api.post(`/reconcile`, { entries });
	return res.data;
};

// GET /reconcile returns discrepancies recalculated against current balances
export const getDiscrepancies = async (): Promise<Discrepancy[]> => {
	const res = await api.get(`/reconcile`);
	return res.data;
};

export const getReconciliationBySourceId = async (
	sourceId: string,
): Promise<SourceReconciliationSummary> => {
	const res = await api.get(`/reconcile/source/${sourceId}`);
	return res.data;
};
