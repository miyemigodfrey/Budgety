import api from "./axios";

export type createTransactionDto = {
	sourceId: string;
	type: "inflow" | "outflow" | "transfer";
	amount: number;
	category: string;
	note: string;
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

export const getTransactions = async (data: TransactionDto) => {
	const res = await api.get("/transactions", { params: data });
	console.log(res);
	return res.data;
};
