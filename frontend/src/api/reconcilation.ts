import api from "./axios";

export const createReconciliation = async (sourceId: string, date: string) => {
	const res = await api.post(`/reconcile`, { sourceId, date });
	return res.data;
};

export const getReconciliation = async (sourceId: string, date: string) => {
	const res = await api.get(`/reconcile`, { params: { sourceId, date } });
	return res.data;
};

export const getReconciliationBySourceId = async (sourceId: string) => {
	const res = await api.get(`/reconcile/source/${sourceId}`);
	return res.data;
};
