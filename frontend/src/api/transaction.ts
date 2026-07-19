import api from "./axios";

export type createTransactionDto = {
	sourceId: string;
	type: "inflow" | "outflow" | "transfer";
	amount: number;
	category: string;
	note: string;
	date: string;
	transferTargetId?: string; // For transfer transactions, the source ID of the other account
};

export type TransactionDto = {
	id: string;
	userId: string;
	sourceId: string;
	type: "inflow" | "outflow" | "transfer";
	amount: number;
	category: string;
	note: string;
	date: string;
	transferTargetId: string; // For transfer transactions, the source ID of the other account
	createdAt: string;
	updatedAt: string;
};

export const createTransaction = async (data: createTransactionDto) => {
	const res = await api.post("/transactions", data);
	return res.data;
};

export const getTransactions = async (): Promise<TransactionDto[]> => {
	const res = await api.get("/transactions");
	return res.data;
};

export const updateTransaction = async (
	id: string,
	data: createTransactionDto,
) => {
	const res = await api.patch(`/transactions/${id}`, data);
	return res.data;
};

export const deleteTransaction = async (id: string) => {
	const res = await api.delete(`/transactions/${id}`);
	return res.data;
};

export type TrendPoint = {
	period: string;
	inflow: number;
	outflow: number;
	transfer: number;
	total: number;
};

export type TrendsDto = {
	months: number;
	totalsByMonth: TrendPoint[];
	bySource: {
		period: string;
		values: {
			sourceId: string;
			sourceName: string;
			inflow: number;
			outflow: number;
			transfer: number;
			total: number;
		}[];
	}[];
};

export const getTrends = async (months = 6): Promise<TrendsDto> => {
	const res = await api.get("/transactions/trends", { params: { months } });
	return res.data;
};
