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
	console.log(res);
	return res.data;
};

export const getTransactions = async (): Promise<TransactionDto[]> => {
	const res = await api.get("/transactions");
	console.log(res);
	return res.data;
};

export const updateTransaction = async (
	id: string,
	data: createTransactionDto,
) => {
	const res = await api.put(`/transactions/${id}`, data);
	return res.data;
};

export const deleteTransaction = async (id: string) => {
	const res = await api.delete(`/transactions/${id}`);
	return res.data;
};
